import llmModelsData from '@/data/llm-models.json'

export interface LLMModel {
  item: string
  vendor: string
  category: string
  unit: string
  value: number
}

export interface StaticModelsData {
  models: LLMModel[]
}

export class ModelsService {
  private static instance: ModelsService
  private models: LLMModel[] = []
  private isInitialized: boolean = false

  static getInstance(): ModelsService {
    if (!ModelsService.instance) {
      ModelsService.instance = new ModelsService()
    }
    return ModelsService.instance
  }

  async getLLMModels(): Promise<LLMModel[]> {
    // Load models from static JSON file if not already initialized
    if (!this.isInitialized) {
      try {
        const staticData = llmModelsData as StaticModelsData
        this.models = staticData.models
        this.isInitialized = true
      } catch (error) {
        console.error('Error loading static LLM models:', error)
        this.models = []
      }
    }

    return this.models
  }

  async getModelOptions(): Promise<Array<{ value: string; label: string }>> {
    const models = await this.getLLMModels()

    return models.map(model => ({
      value: model.item,
      label: `${model.item} (${model.vendor})`,
    }))
  }

  getModelByItem(item: string): LLMModel | undefined {
    return this.models.find(model => model.item === item)
  }
}

export const modelsService = ModelsService.getInstance()
