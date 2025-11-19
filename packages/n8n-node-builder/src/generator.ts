import { readFile } from 'fs/promises';
import * as changeCase from 'change-case';
import type { NodeConfig, PropertySchema, N8nPropertyType } from './types';

/**
 * 从 JSON 配置生成 n8n 节点代码
 */
export class NodeGenerator {
	/**
	 * 从 JSON 文件加载节点配置
	 */
	async loadConfig(configPath: string): Promise<NodeConfig> {
		try {
			const configContent = await readFile(configPath, 'utf-8');
			const config = JSON.parse(configContent) as NodeConfig;

			// 兼容旧格式：input_schema -> properties
			if (config.input_schema && !config.properties) {
				config.properties = config.input_schema.properties;
			}

			// 兼容旧格式：api_url -> apiUrl
			if (config.api_url && !config.apiUrl) {
				config.apiUrl = config.api_url;
			}

			// 设置默认值
			config.type = config.type || 'http';
			config.version = this.normalizeVersion(config.version);
			config.icon = config.icon || 'file:icon.svg';
			config.group = config.group || ['transform'];
			config.color = config.color || '#1A82e2';

			return config;
		} catch (error: any) {
			throw new Error(`加载配置文件失败: ${error.message}`);
		}
	}

	/**
	 * 规范化版本号
	 */
	private normalizeVersion(version?: string | number): number {
		if (!version) return 1;
		if (typeof version === 'number') return version;
		// 从 "1.0.0" 提取主版本号
		const match = version.match(/^(\d+)/);
		return match ? parseInt(match[1]) : 1;
	}

	/**
	 * 生成节点属性配置代码
	 */
	generateProperties(schema: Record<string, PropertySchema>): string {
		const properties: string[] = [];

		for (const [key, prop] of Object.entries(schema)) {
			const property = this.generateSingleProperty(key, prop);
			properties.push(property);
		}

		return properties.join(',\n\t\t\t\t');
	}

	/**
	 * 生成单个属性配置
	 */
	private generateSingleProperty(key: string, prop: PropertySchema): string {
		const parts: string[] = [];

		// 基本属性 - 支持 displayName 或用 description 作为显示名称
		const displayName = prop.displayName || prop.description || changeCase.capitalCase(key);
		parts.push(`displayName: '${displayName}'`);
		parts.push(`name: '${key}'`);

		// 类型映射
		const n8nType = this.mapTypeToN8nType(prop);
		parts.push(`type: '${n8nType}'`);

		// 默认值
		const defaultValue = this.getDefaultValue(prop);
		if (typeof defaultValue === 'string') {
			parts.push(`default: '${defaultValue}'`);
		} else {
			parts.push(`default: ${JSON.stringify(defaultValue)}`);
		}

		// 占位符
		if (prop.placeholder) {
			parts.push(`placeholder: '${prop.placeholder}'`);
		}

		// 描述
		if (prop.description) {
			parts.push(`description: '${prop.description}'`);
		}

		// 必填
		if (prop.required) {
			parts.push(`required: true`);
		}

		// 选项（用于枚举）
		if (prop.enum) {
			const options = prop.enum.map((value) => ({
				name: typeof value === 'string' ? changeCase.capitalCase(value) : String(value),
				value: value,
			}));
			parts.push(`options: ${JSON.stringify(options, null, '\t\t\t\t\t')}`);
		}

		// 数组项的选项
		if (prop.type === 'array' && prop.items?.enum) {
			const options = prop.items.enum.map((value) => ({
				name: typeof value === 'string' ? changeCase.capitalCase(value) : String(value),
				value: value,
			}));
			parts.push(`options: ${JSON.stringify(options, null, '\t\t\t\t\t')}`);
		}

		return `{\n\t\t\t\t\t${parts.join(',\n\t\t\t\t\t')}\n\t\t\t\t}`;
	}

	/**
	 * 获取属性的默认值
	 */
	private getDefaultValue(prop: PropertySchema): any {
		if (prop.default !== undefined) {
			return prop.default;
		}

		switch (prop.type) {
			case 'string':
				return prop.enum ? prop.enum[0] : '';
			case 'number':
			case 'integer':
				return 0;
			case 'boolean':
				return false;
			case 'array':
				return [];
			case 'object':
				return {};
			default:
				return '';
		}
	}

	/**
	 * 将 JSON Schema 类型映射到 n8n 属性类型
	 */
	private mapTypeToN8nType(prop: PropertySchema): N8nPropertyType {
		switch (prop.type) {
			case 'string':
				return prop.enum ? 'options' : 'string';
			case 'number':
			case 'integer':
				return 'number';
			case 'boolean':
				return 'boolean';
			case 'array':
				if (prop.items?.enum) {
					return 'multiOptions';
				}
				return 'collection';
			case 'object':
				return 'collection';
			default:
				return 'string';
		}
	}

	/**
	 * 生成参数提取代码
	 */
	generateParameterExtraction(schema: Record<string, PropertySchema>): string {
		const extractions: string[] = [];

		for (const [key, prop] of Object.entries(schema)) {
			const extraction = this.generateSingleParameterExtraction(key, prop);
			extractions.push(extraction);
		}

		return extractions.join('\n\t\t\t\t');
	}

	/**
	 * 生成单个参数提取代码
	 */
	private generateSingleParameterExtraction(key: string, prop: PropertySchema): string {
		const varName = changeCase.camelCase(key);
		const defaultValue = this.getDefaultValue(prop);

		let extraction = `const ${varName} = this.getNodeParameter('${key}', i, ${JSON.stringify(defaultValue)});`;

		// 处理对象类型
		if (prop.type === 'object' && prop.properties) {
			const subExtractions: string[] = [];
			for (const [subKey, subProp] of Object.entries(prop.properties)) {
				const subVarName = changeCase.camelCase(subKey);
				const subDefaultValue = this.getDefaultValue(subProp);
				subExtractions.push(
					`\t\t\t\tconst ${subVarName} = this.getNodeParameter('${subKey}', i, ${JSON.stringify(subDefaultValue)});`,
				);
			}

			extraction += '\n' + subExtractions.join('\n');

			// 构建子对象
			const subAssignments: string[] = [];
			for (const subKey of Object.keys(prop.properties)) {
				const subVarName = changeCase.camelCase(subKey);
				subAssignments.push(`\t\t\t\t\t${subKey}: ${subVarName}`);
			}
			extraction += `\n\t\t\t\trequestBody.${key} = {\n${subAssignments.join(',\n')}\n\t\t\t\t};`;
		} else {
			extraction += `\n\t\t\t\trequestBody.${key} = ${varName};`;
		}

		return extraction;
	}

	/**
	 * 生成完整的节点代码
	 */
	async generateNodeCode(config: NodeConfig, templatePath: string): Promise<string> {
		// 读取模板文件
		const template = await readFile(templatePath, 'utf-8');

		// 获取属性配置（确保不为 undefined）
		const props = config.properties || {};

		// 生成属性
		const properties = this.generateProperties(props);

		// 生成参数提取代码
		const parameterExtraction = this.generateParameterExtraction(props);

		// 替换模板中的占位符
		const replacements: Record<string, string> = {
			ClassNameReplace: changeCase.pascalCase(config.name),
			DisplayNameReplace: config.displayName,
			N8nNameReplace: changeCase.camelCase(config.name),
			NodeDescriptionReplace: config.description,
			GroupReplace: JSON.stringify(config.group),
			VersionReplace: config.version?.toString() || '1',
			ColorReplace: config.color || '#1A82e2',
			ApiUrlReplace: config.apiUrl || 'http://127.0.0.1:5000/api/execute',
			PROPERTIES_PLACEHOLDER: properties,
			PARAMETER_EXTRACTION_PLACEHOLDER: parameterExtraction,
		};

		let result = template;
		for (const [placeholder, replacement] of Object.entries(replacements)) {
			const regex = new RegExp(placeholder, 'g');
			result = result.replace(regex, replacement);
		}

		return result;
	}

	/**
	 * 生成节点的 .node.json 配置文件内容
	 */
	generateNodeJsonConfig(config: NodeConfig): string {
		const nodeName = changeCase.pascalCase(config.name);

		const jsonConfig = {
			node: [`dist/nodes/${nodeName}/${nodeName}.node.js`],
			credentials: [],
		};

		return JSON.stringify(jsonConfig, null, 2);
	}

	/**
	 * 获取标准化的节点名称（用于文件夹、文件名等）
	 */
	getStandardizedNodeName(config: NodeConfig): string {
		return changeCase.pascalCase(config.name);
	}
}
