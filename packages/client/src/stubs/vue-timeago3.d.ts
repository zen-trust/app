
declare module 'vue-timeago3' {
  import type { Plugin } from 'vue'
  import type { Locale } from 'date-fns'

  interface DefaultConverterOptions {
    useStrict?: false
    includeSeconds?: boolean
    addSuffix?: boolean
  }

  interface StrictConverterOptions {
    useStrict: true
    addSuffix?: boolean
    unit?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'
    roundingMethod?: 'floor' | 'ceil' | 'round'
  }

  type ConverterOptions = DefaultConverterOptions | StrictConverterOptions

  interface TimeagoOptions {
    name?: string
    converter?: unknown
    converterOptions?: ConverterOptions
    locale?: Locale
  }

  const timeAgo: Plugin<TimeagoOptions>
  // eslint-disable-next-line import/no-default-export -- is a library
  export default timeAgo
}
