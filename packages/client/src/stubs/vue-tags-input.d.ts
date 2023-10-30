declare module '@vojtechlanka/vue-tags-input' {
  import type {
    ComponentOptionsMixin,
    ComputedOptions,
    DefineComponent,
    EmitsOptions,
    MethodOptions,
    SlotsType,
  } from 'vue'

  interface ValidationRule {
    rule: RegExp | ((text: string) => boolean)
    classes: string
    disableAdd?: boolean
  }

  interface VueTagsInputProps<T> {
    addFromPaste?: boolean
    addOnBlur?: boolean
    addOnKey?: (number | string)[]
    addOnlyFromAutocomplete?: boolean
    allowEditTags?: boolean
    autocompleteAlwaysOpen?: boolean
    autocompleteFilterDuplicates?: boolean
    autocompleteItems?: string[]
    autocompleteMinLength?: number
    avoidAddingDuplicates?: boolean
    deleteOnBackspace?: boolean
    disabled?: boolean
    isDuplicate?: (tags?: T[], tag?: T) => boolean
    maxTags?: number
    maxlength?: number
    placeholder?: string
    saveOnKey?: (number | string)[]
    separators?: string[]
    tags?: T[]
    validation?: ValidationRule[]
    value?: string
  }

  interface VueTagsInputEmits<T> extends EmitsOptions {
    'adding-duplicate': () => boolean
    'saving-duplicate': () => boolean
    'max-tags-reached': () => boolean
    'before-adding-tag': (tag: T) => boolean
    'before-deleting-tag': (tag: T) => boolean
    'before-editing-tag': (tag: T) => boolean
    'before-saving-tag': (tag: T) => boolean
    'tags-changed': (tags: T[]) => boolean
  }

  interface VueTagsInputDefaults {
    addFromPaste: true
    addOnBlur: true
    addOnKey: [13]
    addOnlyFromAutocomplete: false
    allowEditTags: false
    autocompleteAlwaysOpen: false
    autocompleteFilterDuplicates: true
    autocompleteItems: string[]
    autocompleteMinLength: 1
    avoidAddingDuplicates: true
    deleteOnBackspace: true
    disabled: false
    placeholder: 'Add Tag'
    saveOnKey: [13]
    separators: [';']
    tags: string[]
    validation: ValidationRule[]
    value: ''
  }

  interface VueTagsInputSlots<T> extends SlotsType {
    'tag-left'?: {
      tag: T
      index: number
      edit: boolean
      deletionMark: boolean
      performDelete: (index: number) => unknown
      performOpenEdit: (index: number) => unknown
      performCancelEdit: (index: number) => unknown
      performSaveEdit: (index: number) => unknown
    }
    'tag-right'?: {
      tag: T
      index: number
      edit: boolean
      deletionMark: boolean
      performDelete: (index: number) => unknown
      performOpenEdit: (index: number) => unknown
      performCancelEdit: (index: number) => unknown
      performSaveEdit: (index: number) => unknown
    }
    'tag-actions'?: {
      tag: T
      index: number
      edit: boolean
      deletionMark: boolean
      performDelete: (index: number) => unknown
      performOpenEdit: (index: number) => unknown
      performCancelEdit: (index: number) => unknown
      performSaveEdit: (index: number) => unknown
    }
    'tag-center'?: {
      tag: T
      index: number
      edit: boolean
      maxlength: number
      deletionMark: boolean
      performDelete: (index: number) => unknown
      performOpenEdit: (index: number) => unknown
      performCancelEdit: (index: number) => unknown
      performSaveEdit: (index: number) => unknown
      validateTag: (index: number, event: InputEvent) => unknown
    }
    'autocomplete-item'?: {
      item: T
      index: number
      selected: boolean
      performAdd: (item: T) => unknown
    }
    'autocomplete-header'?: Record<string, unknown>
    'autocomplete-footer'?: Record<string, unknown>
    'between-elements'?: Record<string, unknown>
  }

  export interface Tag {
    text: string
    tiClasses?: string[]
  }

  export const VueTagsInput: DefineComponent<
    VueTagsInputProps<Tag>,
    unknown,
    unknown,
    ComputedOptions,
    MethodOptions,
    ComponentOptionsMixin,
    ComponentOptionsMixin,
    VueTagsInputEmits<Tag>,
    string,
    unknown,
    unknown,
    VueTagsInputDefaults<Tag>,
    VueTagsInputSlots<Tag>
  >
}
