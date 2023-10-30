<script lang="ts" setup>
import { computed, provide, ref } from 'vue'
import { CurrentStepSymbol, type Step, StepsSymbol } from '@/components/setup/constants'

const props = withDefaults(
  defineProps<{
    modelValue?: number
  }>(),
  { modelValue: 0 },
)

const emit = defineEmits<{
  'update:modelValue': [number]
  complete: []
}>()

const steps = ref<Step[]>([])
const currentStep = computed(() => props.modelValue)

provide(StepsSymbol, {
  steps,
  updateSteps: (updatedSteps: Step[]) => {
    steps.value = updatedSteps
  },
})
provide(CurrentStepSymbol, {
  currentStep,
  updateCurrentStep: (step: number) => {
    emit('update:modelValue', step)

    if (step >= steps.value.length) {
      emit('complete')
    }
  },
})

function progressClasses(index: number) {
  return {
    'text-green-500 dark:text-green-700': currentStep.value > index,
    'text-gray-300 dark:text-gray-800': currentStep.value <= index,
  }
}
</script>

<template>
  <article class="flex flex-col grow">
    <div class="grow">
      <slot />
    </div>

    <footer class="mt-16 mb-8">
      <nav class="flex justify-stretch">
        <div
          v-for="(step, index) in steps"
          :key="index"
          :class="progressClasses(index)"
          class="relative flex flex-1 flex-col items-center first:before:hidden last:after:hidden before:absolute before:block before:w-1/2 before:left-0 before:top-5 before:-translate-y-1/2 before:h-1 before:bg-current after:absolute after:block after:right-0 after:top-5 after:-translate-y-1/2 after:w-1/2 after:h-1 after:bg-current"
        >
          <div
            :class="progressClasses(index)"
            class="flex justify-center items-center leading-none w-10 h-10 bg-current ring-8 ring-white dark:ring-gray-900 rounded-full z-10"
          >
            <span class="font-medium text-white dark:text-gray-300">
              {{ index + 1 }}
            </span>
          </div>
          <span class="block mt-2 text-sm text-gray-500 dark:text-gray-400/50">
            {{ step.title }}
          </span>
        </div>
      </nav>
    </footer>
  </article>
</template>
