import { readFile } from 'fs/promises';
import * as changeCase from 'change-case';

export interface NodeConfig {
	name: string;
	displayName: string;
	description: string;
	version?: string;
	icon?: string;
	group?: string[];
	color?: string;
	api_url?: string;
	supports_file_upload?: boolean;
	input_schema: {
		type: 'object';
		properties: Record<string, PropertySchema>;
		required?: string[];
	};
	output_schema?: {
		type: 'object';
		properties: Record<string, any>;
	};
}

export interface PropertySchema {
	type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
	description?: string;
	default?: any;
	placeholder?: string;
	required?: boolean;
	enum?: any[];
	items?: PropertySchema | { enum: any[] };
	properties?: Record<string, PropertySchema>;
	displayOptions?: {
		show?: Record<string, any[]>;
		hide?: Record<string, any[]>;
	};
}

/**
 * 从 JSON 配置生成 n8n 节点代码
 */
export class JsonNodeGenerator {
	/**
	 * 从 JSON 文件加载节点配置
	 */
	async loadConfig(configPath: string): Promise<NodeConfig> {
		try {
			const configContent = await readFile(configPath, 'utf-8');
			const config = JSON.parse(configContent) as NodeConfig;

			// 验证必需字段
			if (!config.name || !config.displayName || !config.description || !config.input_schema) {
				throw new Error('配置文件缺少必需字段: name, displayName, description, input_schema');
			}

			return config;
		} catch (error) {
			throw new Error(`加载配置文件失败: ${error.message}`);
		}
	}

	/**
	 * 生成节点属性配置
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

		// 基本属性
		parts.push(`displayName: '${prop.description || changeCase.capitalCase(key)}'`);
		parts.push(`name: '${key}'`);

		// 类型映射
		const n8nType = this.mapTypeToN8nType(prop);
		parts.push(`type: '${n8nType}'`);

		// 默认值 - 如果没有指定默认值，根据类型提供一个
		let defaultValue = prop.default;
		if (defaultValue === undefined) {
			switch (prop.type) {
				case 'string':
					defaultValue = prop.enum ? prop.enum[0] : '';
					break;
				case 'number':
				case 'integer':
					defaultValue = 0;
					break;
				case 'boolean':
					defaultValue = false;
					break;
				case 'array':
					defaultValue = [];
					break;
				case 'object':
					defaultValue = {};
					break;
				default:
					defaultValue = '';
			}
		}

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
		if (prop.type === 'array' && prop.items && 'enum' in prop.items) {
			const options = prop.items.enum!.map((value) => ({
				name: typeof value === 'string' ? changeCase.capitalCase(value) : String(value),
				value: value,
			}));
			parts.push(`options: ${JSON.stringify(options, null, '\t\t\t\t\t')}`);
		}

		// 显示选项
		if (prop.displayOptions) {
			parts.push(`displayOptions: ${JSON.stringify(prop.displayOptions, null, '\t\t\t\t\t')}`);
		}

		return `{\n\t\t\t\t\t${parts.join(',\n\t\t\t\t\t')}\n\t\t\t\t}`;
	}

	/**
	 * 将 JSON Schema 类型映射到 n8n 属性类型
	 */
	private mapTypeToN8nType(prop: PropertySchema): string {
		switch (prop.type) {
			case 'string':
				return prop.enum ? 'options' : 'string';
			case 'number':
			case 'integer':
				return 'number';
			case 'boolean':
				return 'boolean';
			case 'array':
				if (prop.items && 'enum' in prop.items) {
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

		// 获取默认值，如果没有指定则根据类型提供一个
		let defaultValue = prop.default;
		if (defaultValue === undefined) {
			switch (prop.type) {
				case 'string':
					defaultValue = prop.enum ? prop.enum[0] : '';
					break;
				case 'number':
				case 'integer':
					defaultValue = 0;
					break;
				case 'boolean':
					defaultValue = false;
					break;
				case 'array':
					defaultValue = [];
					break;
				case 'object':
					defaultValue = {};
					break;
				default:
					defaultValue = '';
			}
		}

		let extraction = `const ${varName} = this.getNodeParameter('${key}', i, ${JSON.stringify(defaultValue)});`;

		// 处理对象类型的特殊情况
		if (prop.type === 'object' && prop.properties) {
			const subExtractions: string[] = [];
			for (const [subKey, subProp] of Object.entries(prop.properties)) {
				const subVarName = changeCase.camelCase(subKey);
				const subDefaultValue =
					subProp.default !== undefined ? JSON.stringify(subProp.default) : 'undefined';
				subExtractions.push(
					`\t\t\t\tconst ${subVarName} = this.getNodeParameter('${subKey}', i, ${subDefaultValue});`,
				);
			}

			extraction += '\n' + subExtractions.join('\n');
		}

		// 添加到请求体
		if (prop.type === 'object' && prop.properties) {
			// 对于对象类型，需要构建子对象
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

		// 生成属性
		const properties = this.generateProperties(config.input_schema.properties);

		// 生成参数提取代码
		const parameterExtraction = this.generateParameterExtraction(config.input_schema.properties);

		// 替换模板中的占位符
		const replacements = {
			ClassNameReplace: changeCase.pascalCase(config.name),
			DisplayNameReplace: config.displayName,
			N8nNameReplace: changeCase.camelCase(config.name),
			NodeDescriptionReplace: config.description,
			GroupReplace: config.group || ['transform'],
			VersionReplace: parseInt(config.version?.split('.')[0] || '1').toString(),
			ColorReplace: config.color || '#4CAF50',
			ApiUrlReplace: config.api_url || 'http://127.0.0.1:5000/api/execute',
			PROPERTIES_PLACEHOLDER: properties,
			PARAMETER_EXTRACTION_PLACEHOLDER: parameterExtraction,
		};

		let result = template;
		for (const [placeholder, replacement] of Object.entries(replacements)) {
			const regex = new RegExp(placeholder, 'g');
			const replacementStr =
				typeof replacement === 'object' ? JSON.stringify(replacement) : replacement;
			result = result.replace(regex, replacementStr);
		}

		return result;
	}

	/**
	 * 生成节点的.json配置文件内容
	 */
	generateNodeJsonConfig(config: NodeConfig): string {
		const nodeName = changeCase.pascalCase(config.name);
		const nodeVersion = config.version?.split('.')[0] || '1';

		const jsonConfig = {
			node: `n8n-nodes-${nodeName}`,
			nodeVersion: nodeVersion,
			codexVersion: '1.0',
			categories: config.group || ['Development'],
			resources: {},
		};

		return JSON.stringify(jsonConfig, null, '\t');
	}

	/**
	 * 获取标准化的节点名称（用于文件夹、文件名等）
	 */
	getStandardizedNodeName(config: NodeConfig): string {
		return changeCase.pascalCase(config.name);
	}
}
