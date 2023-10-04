import ayonClient from '/src/ayon'
import { Icon } from '@ynput/ayon-react-components'
import { TimestampField } from '/src/containers/fieldFormat'

// TODO rename .jsx -> .js
const formatAttribute = (node, changes, fieldName, styled = true) => {
  const chobj = changes[node.id]

  let className = ''
  let value = node.attrib && node.attrib[fieldName]
  if (chobj && fieldName in chobj) {
    value = chobj[fieldName]
    className = 'changed'
  } else if (node.ownAttrib && !node.ownAttrib.includes(fieldName)) {
    className = 'inherited'
  }
  if (!styled) return value

  if (ayonClient.settings.attributes.length) {
    const fieldType = ayonClient.settings.attributes.find((attrib) => attrib.name === fieldName)
      .data.type
    if (fieldType === 'datetime') return <TimestampField value={value} ddOnly />
    if (fieldType === 'boolean')
      return !value ? '' : <Icon icon="check" className={`editor-field ${className}`} />
  }

  return <span className={`editor-field ${className}`}>{value}</span>
}

const formatType = (node, changes, styled = true) => {
  const chobj = changes[node.id] || {}
  const style = {}
  let value

  if (node.__entityType === 'folder') {
    value = '_folderType' in chobj ? chobj._folderType : node.folderType
    if ('_folderType' in chobj) style.color = 'var(--color-changed)'
  } else {
    value = chobj?._taskType ? chobj._taskType : node.taskType
    if (!value) style.color = 'var(--color-hl-error)'
    else if ('_taskType' in chobj) style.color = 'var(--color-changed)'
  }

  if (!styled) return value
  if (node.__entityType === 'folder' && !value) value = 'Folder'
  return (
    <span className="editor-field" style={style}>
      {value}
    </span>
  )
}

const getColumns = () => {
  if (ayonClient.settings.attributes.length === 0) return []
  let cols = []
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('folder')) {
      cols.push({
        name: attrib.name,
        title: attrib.data.title,
        type: attrib.data.type,
      })
    }
  }
  return cols
}

export { getColumns, formatType, formatAttribute }
