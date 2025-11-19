import type { NodeConfig, PropertySchema } from './types';

/**
 * 配置验证器
 */
export class ConfigValidator {
	/**
	 * 验证节点配置
	 */
	validate(config: NodeConfig): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// 验证必需字段
		if (!config.name || config.name.trim() === '') {
			errors.push('缺少必需字段: name');
		}

		if (!config.displayName || config.displayName.trim() === '') {
			errors.push('缺少必需字段: displayName');
		}

		if (!config.description || config.description.trim() === '') {
			errors.push('缺少必需字段: description');
		}

		// 验证属性配置 - 支持新格式 (properties) 和旧格式 (input_schema.properties)
		let properties = config.properties;
		if (!properties && config.input_schema) {
			properties = config.input_schema.properties;
		}

		if (!properties || typeof properties !== 'object') {
			errors.push('缺少必需字段: properties 或 input_schema.properties（必须是对象）');
		}

		// 验证节点类型
		if (config.type && !['http', 'webhook', 'trigger'].includes(config.type)) {
			errors.push(`无效的节点类型: ${config.type}（支持的类型: http, webhook, trigger）`);
		}

		// 验证属性配置
		if (properties) {
			const propErrors = this.validateProperties(properties);
			errors.push(...propErrors);
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 验证属性配置
	 */
	private validateProperties(properties: Record<string, PropertySchema>, prefix = ''): string[] {
		const errors: string[] = [];

		for (const [key, prop] of Object.entries(properties)) {
			const propPath = prefix ? `${prefix}.${key}` : key;

			// 验证类型
			if (!prop.type) {
				errors.push(`属性 ${propPath}: 缺少 type 字段`);
				continue;
			}

			const validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object'];
			if (!validTypes.includes(prop.type)) {
				errors.push(
					`属性 ${propPath}: 无效的类型 ${prop.type}（支持的类型: ${validTypes.join(', ')}）`,
				);
			}

			// 验证 displayName（可选，可以从 description 推断）
			if (!prop.displayName && !prop.description) {
				errors.push(`属性 ${propPath}: 必须提供 displayName 或 description 字段`);
			}

			// 验证数组类型
			if (prop.type === 'array') {
				if (!prop.items) {
					errors.push(`属性 ${propPath}: array 类型必须提供 items 字段`);
				}
			}

			// 验证对象类型
			if (prop.type === 'object') {
				if (prop.properties) {
					const subErrors = this.validateProperties(prop.properties, propPath);
					errors.push(...subErrors);
				}
			}

			// 验证枚举
			if (prop.enum) {
				if (!Array.isArray(prop.enum) || prop.enum.length === 0) {
					errors.push(`属性 ${propPath}: enum 必须是非空数组`);
				}
			}
		}

		return errors;
	}
}
