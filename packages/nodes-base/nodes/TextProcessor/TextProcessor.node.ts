import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

export class TextProcessor implements INodeType {
	description: INodeTypeDescription;

	constructor() {
		this.description = {
			displayName: '文本处理器',
			name: 'textProcessor',
			group: ['transform'],
			version: 1,
			description: '强大的文本处理算子，支持多种文本操作',
			subtitle: '={{$parameter["method"] + ": " + $parameter["url"]}}',
			defaults: {
				name: '文本处理器',
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
				{
					displayName: '参数配置',
					name: 'parametersNotice',
					type: 'notice',
					default: '配置要发送到 API 的参数',
				},
				{
					displayName: '是否启用日志',
					name: 'enable_logging',
					type: 'boolean',
					default: false,
					description: '是否启用日志',
				},
				{
					displayName: '上传文件',
					name: 'input_file',
					type: 'string',
					default: '',
					description: '上传文件',
				},
				{
					displayName: '输入文本',
					name: 'input_text',
					type: 'string',
					default: 'Hello World',
					description: '输入文本',
				},
				{
					displayName: '处理类型',
					name: 'process_type',
					type: 'options',
					default: 'uppercase',
					description: '处理类型',
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
							name: 'Length',
							value: 'length',
						},
					],
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

				const enableLogging = this.getNodeParameter('enable_logging', i, false);
				requestBody.enable_logging = enableLogging;
				const inputFile = this.getNodeParameter('input_file', i, '');
				requestBody.input_file = inputFile;
				const inputText = this.getNodeParameter('input_text', i, 'Hello World');
				requestBody.input_text = inputText;
				const processType = this.getNodeParameter('process_type', i, 'uppercase');
				requestBody.process_type = processType;

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
