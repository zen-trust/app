import type { InjectionKey, Ref } from "vue";

export const StepsSymbol = Symbol('steps') as InjectionKey<{
  steps: Ref<Step[]>
  updateSteps: (steps: Step[]) => unknown
}>
export const CurrentStepSymbol = Symbol('current-step') as InjectionKey<{
  currentStep: Ref<number>
  updateCurrentStep: (step: number) => unknown
}>

export interface Step {
  id: string
  title: string
  description: string | undefined
}
