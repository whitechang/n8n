import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

export class MyCustomNode implements INodeType {
	description: INodeTypeDescription;

	constructor() {
		this.description = {
			displayName: '我的自定义节点',
			name: 'myCustomNode',
			group: ['transform'],
			version: 1,
			description: '这是一个示例自定义节点',
			subtitle: '={{$parameter["method"] + ": " + $parameter["url"]}}',
			defaults: {
				name: '我的自定义节点',
				color: '#4CAF50',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
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
					default: 'http://127.0.0.1:8080/api/process',
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
				{
					displayName: '参数配置',
					name: 'parametersNotice',
					type: 'notice',
					default: '配置要发送到 API 的参数',
				},
				{
					displayName: '输入文本',
					name: 'inputText',
					type: 'string',
					default: '',
					placeholder: '请输入要处理的文本...',
					description: '输入文本',
					required: true,
				},
				{
					displayName: '操作类型',
					name: 'operation',
					type: 'options',
					default: 'uppercase',
					description: '操作类型',
					options: [
						{
							name: 'Uppercase',
							value: 'uppercase',
						},
						{
							name: 'Lowercase',
							value: 'lowercase',
						},
						{
							name: 'Reverse',
							value: 'reverse',
						},
						{
							name: 'Trim',
							value: 'trim',
						},
					],
				},
				{
					displayName: '包含时间戳',
					name: 'includeTimestamp',
					type: 'boolean',
					default: false,
					description: '包含时间戳',
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const method = this.getNodeParameter('method', i) as IHttpRequestMethods;
				const url = this.getNodeParameter('url', i) as string;
				const timeout = this.getNodeParameter('timeout', i) as number;

				const requestBody: any = {};

				const inputText = this.getNodeParameter('inputText', i, '');
				requestBody.inputText = inputText;
				const operation = this.getNodeParameter('operation', i, 'uppercase');
				requestBody.operation = operation;
				const includeTimestamp = this.getNodeParameter('includeTimestamp', i, false);
				requestBody.includeTimestamp = includeTimestamp;

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
