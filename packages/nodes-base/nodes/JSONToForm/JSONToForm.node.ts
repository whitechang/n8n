import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

export class JSONToForm implements INodeType {
	description: INodeTypeDescription;

	constructor() {
		this.description = {
			displayName: '表单节点',
			name: 'JSONToForm',
			icon: 'file:n8n.svg',
			group: ['transform'],
			version: 1,
			description: '根据前一个节点的输出动态生成参数的自定义节点',
			subtitle: '={{$parameter["method"] + ": " + $parameter["url"]}}',
			defaults: {
				name: '表单节点',
				color: '#4CAF50',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				// ==================== 请求配置区域 ====================
				{
					displayName: '请求配置',
					name: 'requestConfigNotice',
					type: 'notice',
					default: '配置 API 请求的基本信息',
				},
				{
					displayName: '请求方法',
					name: 'method',
					type: 'options',
					options: [
						{
							name: 'GET',
							value: 'GET',
						},
						{
							name: 'POST',
							value: 'POST',
						},
						{
							name: 'PUT',
							value: 'PUT',
						},
						{
							name: 'DELETE',
							value: 'DELETE',
						},
						{
							name: 'PATCH',
							value: 'PATCH',
						},
					],
					default: 'POST',
					description: 'HTTP 请求方法',
				},
				{
					displayName: '请求地址',
					name: 'url',
					type: 'string',
					default: 'http://127.0.0.1:5000/api/execute',
					placeholder: 'http://example.com/api/execute',
					description: 'API 请求的完整 URL 地址',
					required: true,
				},
				{
					displayName: '请求超时时间（毫秒）',
					name: 'timeout',
					type: 'number',
					default: 30000,
					description: '请求超时时间，单位为毫秒',
				},
				// ==================== 参数配置区域 ====================
				{
					displayName: '参数配置',
					name: 'parametersNotice',
					type: 'notice',
					default: '配置要发送到 API 的参数',
				},
				// 文本输入字段
				{
					displayName: '要处理的文本',
					name: 'text',
					type: 'string',
					default: 'Hello, World!',
					description: '要处理的文本',
					required: true,
				},
				// 大小写敏感字段
				{
					displayName: '大小写敏感',
					name: 'case_sensitive',
					type: 'boolean',
					default: true,
					description: '大小写敏感',
				},
				// 操作列表字段
				{
					displayName: '要执行的操作列表',
					name: 'operations',
					type: 'multiOptions',
					default: ['uppercase'],
					description: '要执行的操作列表',
					options: [
						{
							name: '转大写',
							value: 'uppercase',
						},
						{
							name: '转小写',
							value: 'lowercase',
						},
						{
							name: '首字母大写',
							value: 'title',
						},
						{
							name: '反转',
							value: 'reverse',
						},
						{
							name: '单词计数',
							value: 'word_count',
						},
						{
							name: '字符计数',
							value: 'char_count',
						},
						{
							name: '行数计数',
							value: 'line_count',
						},
					],
				},
				// 查找替换配置
				{
					displayName: '启用查找替换',
					name: 'enable_find_replace',
					type: 'boolean',
					default: false,
					description: '是否启用查找替换功能',
				},
				{
					displayName: '要查找的文本',
					name: 'find',
					type: 'string',
					default: '',
					description: '要查找的文本',
					displayOptions: {
						show: {
							enable_find_replace: [true],
						},
					},
				},
				{
					displayName: '替换为的文本',
					name: 'replace',
					type: 'string',
					default: '',
					description: '替换为的文本',
					displayOptions: {
						show: {
							enable_find_replace: [true],
						},
					},
				},
				{
					displayName: '是否使用正则表达式',
					name: 'use_regex',
					type: 'boolean',
					default: false,
					description: '是否使用正则表达式',
					displayOptions: {
						show: {
							enable_find_replace: [true],
						},
					},
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// 遍历每个输入项
		for (let i = 0; i < items.length; i++) {
			try {
				// 获取请求配置
				const method = this.getNodeParameter('method', i) as IHttpRequestMethods;
				const url = this.getNodeParameter('url', i) as string;
				const timeout = this.getNodeParameter('timeout', i) as number;

				// 获取表单参数
				const text = this.getNodeParameter('text', i) as string;
				const caseSensitive = this.getNodeParameter('case_sensitive', i) as boolean;
				const operations = this.getNodeParameter('operations', i) as string[];
				const enableFindReplace = this.getNodeParameter('enable_find_replace', i) as boolean;

				// 构建请求体
				const requestBody: any = {
					text,
					case_sensitive: caseSensitive,
					operations,
				};

				// 如果启用了查找替换，添加相关参数
				if (enableFindReplace) {
					const find = this.getNodeParameter('find', i) as string;
					const replace = this.getNodeParameter('replace', i) as string;
					const useRegex = this.getNodeParameter('use_regex', i) as boolean;

					requestBody.find_replace = {
						find,
						replace,
						use_regex: useRegex,
					};
				}

				// 调用API接口
				const response = await this.helpers.httpRequest({
					method,
					url,
					body: requestBody,
					json: true,
					timeout,
					headers: {
						'Content-Type': 'application/json',
					},
				});

				// 将响应数据添加到返回结果中
				returnData.push({
					json: {
						...response,
						_request: {
							method,
							url,
							body: requestBody,
						},
					},
					pairedItem: { item: i },
				});
			} catch (error) {
				// 处理错误
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							_request: {
								method: this.getNodeParameter('method', i),
								url: this.getNodeParameter('url', i),
							},
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
