<script lang="ts" setup>
import { computed, inject, onMounted, ref } from 'vue'
import ZButton from '@/components/z-button.vue'
import { CurrentStepSymbol, StepsSymbol } from '@/components/setup/constants'

const props = defineProps<{
  id: string
  title: string
  description?: string
  ready?: boolean
  valid?: boolean
}>()

const emit = defineEmits<{
  continue: []
  finalize: []
}>()

const { currentStep } = inject(CurrentStepSymbol, {
  currentStep: ref(0),
  updateCurrentStep: () => {}
})
const { steps, updateSteps } = inject(StepsSymbol, {
  steps: ref([]),
  updateSteps: () => {}
})

const isActive = computed(() => props.id === steps.value[currentStep.value]?.id)
const isLastStep = computed(() => currentStep.value === steps.value.length - 1)

function nextStep() {
  //updateCurrentStep(currentStep.value + 1)
  emit('continue')
}

function finalize() {
  nextStep()
  emit('finalize')
}

function handleSubmission(event: Event) {
  event.preventDefault()
  nextStep()
}

onMounted(() => {
  updateSteps([
    ...steps.value,
    {
      id: props.id,
      title: props.title,
      description: props.description
    }
  ])
})
</script>

<template>
  <section :class="{ hidden: !isActive }">
    <form class="contents" @submit="handleSubmission">
      <header>
        <h2 class="font-medium text-2xl mb-1">
          <slot :title="title" name="title">
            <span v-text="title" />
          </slot>
        </h2>
        <p v-if="description" class="text-gray-500">
          <slot :description="description" name="description">
            <span v-text="description" />
          </slot>
        </p>
      </header>

      <div class="mt-4">
        <slot :disabled="!ready" />
      </div>

      <footer class="mt-8">
        <z-button v-if="isLastStep" :disabled="!ready || !valid" @click="finalize">
          <span>Complete setup</span>
        </z-button>
        <z-button v-else :disabled="!ready || !valid" submit>
          <span>Continue</span>
        </z-button>
      </footer>
    </form>
  </section>
</template>
