/**
 * 属性配置的 JSON Schema
 */
export interface PropertySchema {
	type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
	displayName?: string; // 新格式使用 displayName，旧格式从 description 推断
	description?: string;
	default?: any;
	required?: boolean;
	placeholder?: string;
	enum?: string[];
	format?: string; // 如 "file"
	items?: {
		type?: string;
		enum?: string[];
	};
	properties?: Record<string, PropertySchema>;
	// 旧格式支持的字段（会被忽略）
	widget?: any;
	displayOptions?: {
		show?: Record<string, any[]>;
		hide?: Record<string, any[]>;
	};
}

/**
 * 节点类型
 */
export type NodeType = 'http' | 'webhook' | 'trigger';

/**
 * 节点配置接口（兼容两种格式）
 */
export interface NodeConfig {
	// 基本信息
	name: string; // 节点内部名称 (camelCase)
	displayName: string; // 显示名称
	description: string; // 描述

	// 节点类型
	type?: NodeType; // 节点类型，默认为 'http'

	// 可选配置
	version?: string | number; // 版本号，默认 1
	icon?: string; // 图标文件名，默认 'file:icon.svg'
	group?: string[]; // 分组，默认 ['transform']
	color?: string; // 颜色，默认 '#1A82e2'

	// API 配置 (仅 http 类型)
	apiUrl?: string;
	api_url?: string; // 兼容旧格式

	// 支持文件上传
	supports_file_upload?: boolean;

	// 属性 Schema（支持两种格式）
	properties?: Record<string, PropertySchema>;
	// 旧格式：input_schema 包装的结构
	input_schema?: {
		type?: 'object';
		properties: Record<string, PropertySchema>;
		required?: string[];
	};

	// 输出 Schema (可选)
	output_schema?: Record<string, PropertySchema>;
}

/**
 * 生成选项
 */
export interface GenerateOptions {
	configPath: string; // 配置文件路径
	outputDir?: string; // 输出目录，默认 './output'
}

/**
 * n8n 属性类型
 */
export type N8nPropertyType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'options'
	| 'multiOptions'
	| 'collection'
	| 'fixedCollection';

/**
 * n8n 属性定义
 */
export interface N8nProperty {
	displayName: string;
	name: string;
	type: N8nPropertyType;
	default?: any;
	required?: boolean;
	description?: string;
	placeholder?: string;
	options?: Array<{ name: string; value: string }>;
	typeOptions?: any;
}
