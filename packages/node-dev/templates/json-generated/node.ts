import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

export class ClassNameReplace implements INodeType {
	description: INodeTypeDescription;

	constructor() {
		this.description = {
			displayName: 'DisplayNameReplace',
			name: 'N8nNameReplace',
			group: GroupReplace,
			version: VersionReplace,
			description: 'NodeDescriptionReplace',
			subtitle: '={{$parameter["method"] + ": " + $parameter["url"]}}',
			defaults: {
				name: 'DisplayNameReplace',
				color: 'ColorReplace',
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
					default: 'ApiUrlReplace',
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
				PROPERTIES_PLACEHOLDER,
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

				PARAMETER_EXTRACTION_PLACEHOLDER;

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
