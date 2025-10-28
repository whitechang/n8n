import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class MyCustomNode implements INodeType {
	description: INodeTypeDescription;

	constructor() {
		this.description = {
			displayName: '动态配置节点',
			name: 'myCustomNode',
			group: ['transform'],
			version: 1,
			description: '根据前一个节点的输出动态生成参数的自定义节点',
			defaults: {
				name: '动态配置节点',
				color: '#4CAF50',
			},
			inputs: ['main'],
			outputs: ['main'],
			properties: [
				{
					displayName: '执行API地址',
					name: 'executeUrl',
					type: 'string',
					default: 'http://127.0.0.1:5000/api/execute',
					description: '执行操作的API地址',
				},
				{
					displayName: '使用所有输入字段',
					name: 'useAllFields',
					type: 'boolean',
					default: true,
					description: '是否使用前一个节点输出的所有字段作为参数',
				},
				{
					displayName: '额外参数',
					name: 'extraParams',
					type: 'fixedCollection',
					placeholder: '添加参数',
					default: {},
					description: '添加额外的自定义参数',
					typeOptions: {
						multipleValues: true,
					},
					options: [
						{
							name: 'parameter',
							displayName: '参数',
							values: [
								{
									displayName: '参数名',
									name: 'name',
									type: 'string',
									default: '',
									description: '参数的名称',
								},
								{
									displayName: '参数值',
									name: 'value',
									type: 'string',
									default: '',
									description: '参数的值',
								},
							],
						},
					],
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// 获取配置参数
		const executeUrl = this.getNodeParameter('executeUrl', 0) as string;
		const useAllFields = this.getNodeParameter('useAllFields', 0) as boolean;
		const extraParams = this.getNodeParameter('extraParams', 0, {}) as any;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const inputData = items[itemIndex].json;

				// 构建请求参数
				const requestData: Record<string, any> = {
					timestamp: new Date().toISOString(),
				};

				// 如果启用了使用所有字段，将输入数据的所有字段添加到请求中
				if (useAllFields) {
					Object.assign(requestData, inputData);
				}

				// 添加额外的自定义参数
				if (extraParams.parameter && Array.isArray(extraParams.parameter)) {
					for (const param of extraParams.parameter) {
						if (param.name && param.value !== undefined) {
							requestData[param.name] = param.value;
						}
					}
				}

				// 始终包含原始输入数据作为参考
				requestData._originalInput = inputData;

				// 调用执行接口
				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: executeUrl,
					headers: {
						'Content-Type': 'application/json',
					},
					body: requestData,
					returnFullResponse: true,
				});

				// 处理响应数据
				let responseData: any;
				try {
					responseData =
						typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
				} catch (error) {
					responseData = response.body;
				}

				// 准备输出数据
				const outputItem: INodeExecutionData = {
					json: {
						success: response.statusCode >= 200 && response.statusCode < 300,
						statusCode: response.statusCode,
						data: responseData,
						requestData: requestData,
						originalInput: inputData,
						timestamp: new Date().toISOString(),
					},
				};

				returnData.push(outputItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error.message,
							originalInput: items[itemIndex].json,
							timestamp: new Date().toISOString(),
						},
					});
				} else {
					throw new NodeOperationError(this.getNode(), `执行失败: ${error.message}`, { itemIndex });
				}
			}
		}

		return this.prepareOutputData(returnData);
	}
}
