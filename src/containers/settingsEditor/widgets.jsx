import { useMemo } from 'react'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { InputNumber } from 'primereact/inputnumber'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'

const updateOverrides = (props, changed) => {
  if (!props.formContext) {
    return // WARN!
  }
  if (changed && !props.formContext.changedKeys.includes(props.id))
    props.formContext.changedKeys.push(props.id)
  else if (!changed && props.formContext.changedKeys.includes(props.id))
    props.formContext.changedKeys.splice(
      props.formContext.changedKeys.indexOf(props.id),
      1
    )
  props.formContext?.onSetChangedKeys(props.formContext.changedKeys)
}

const parseContext = (props) => {
  const result = { originalValue: null, path: [] }
  if (props.formContext?.overrides && props.formContext.overrides[props.id]) {
    result.originalValue = props.formContext.overrides[props.id].value
    result.path = props.formContext.overrides[props.id].path
  }
  return result
}

const CheckboxWidget = function (props) {
  const { originalValue, path } = parseContext(props)

  const onChange = (e) => {
    updateOverrides(props, e.value !== originalValue)
    props.onChange(e.value)
    props.formContext?.onSetBreadcrumbs(path)
  }

  return <InputSwitch checked={props.value} onChange={onChange} />
}

const SelectWidget = (props) => {
  const { originalValue, path } = parseContext(props)

  const options = []
  for (const opt of props.options.enumOptions) {
    const label = opt.value?.label || opt.value?.value || opt.value
    const value = opt.value?.value || opt.value
    options.push({ label, value })
  }

  // Ensure the value is in the options
  let value
  if (props.multiple){
    value = props.value || []
    value = value.filter((v) => options.find((o) => o.value === v))
  } else {
    value = props.value || ''
    if (!options.find((o) => o.value === value)) value = ''
  }

  const tooltip = []
  if (props.rawErrors) {
    for (const err of props.rawErrors) tooltip.push(err)
  }

  const onChange = (e) => {
    updateOverrides(props, e.value !== originalValue)
    props.onChange(e.value)
  }

  const onFocus = (e) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  if (props.multiple) {
    return (
      <>
        <MultiSelect
          options={options}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          className={props.rawErrors?.length ? 'p-invalid' : ''}
        />
      </>
    )
  }

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      onBlur={props.onBlur}
      onFocus={onFocus}
      optionLabel="label"
      optionValue="value"
      tooltip={tooltip.join('\n')}
      tooltipOptions={{ position: 'bottom' }}
      className={props.rawErrors?.length ? 'p-invalid' : ''}
    />
  )
}

const TextWidget = (props) => {
  const { originalValue, path } = parseContext(props)
  const tooltip = []
  if (props.rawErrors?.length) {
    for (const err of props.rawErrors) tooltip.push(err)
  } 
  // hack for string arrays. to prevent null value passed to the
  // input text widget handled as uncontrolled input
  const value = useMemo(() => props.value || '', [props.value])

  let Input = null
  const opts = {}
  if (props.schema.type === 'integer') {
    Input = InputNumber
    if (props.schema.minimum !== undefined) opts.min = props.schema.minimum
    if (props.schema.maximum !== undefined) opts.max = props.schema.maximum
    if (props.schema.exclusiveMinimum !== undefined) opts.min = props.schema.exclusiveMinimum + 1
    if (props.schema.exclusiveMaximum !== undefined) opts.max = props.schema.exclusiveMaximum - 1
    opts.step = 1
    opts.showButtons = true
    opts.useGrouping = false
    opts.onChange = (e) => {
      updateOverrides(props, e.value !== originalValue)
      props.onChange(e.value)
    }
  } else if (props.schema.widget === 'textarea') {
    Input = InputTextarea
    opts.autoResize = true
    opts.rows = 8
    opts.onChange = (e) => {
      updateOverrides(props, e.target.value !== originalValue)
      props.onChange(e.target.value)
    }
  } else {
    Input = InputText
    opts.onChange = (e) => {
      updateOverrides(props, e.target.value !== originalValue)
      props.onChange(e.target.value)
    }
  }

  const onFocus = (e) => {
    props.formContext?.onSetBreadcrumbs(path)
    props.onFocus(e)
  }

  return (
    <Input
      className={props.rawErrors?.length ? 'p-invalid' : ''}
      value={value}
      onBlur={props.onBlur}
      onFocus={onFocus}
      tooltip={tooltip.join('\n')}
      tooltipOptions={{ position: 'bottom' }}
      {...opts}
    />
  )
}

export { TextWidget, SelectWidget, CheckboxWidget }
