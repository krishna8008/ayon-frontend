import React, { useContext, useEffect, useMemo } from 'react'
import { useGetAddonListQuery } from '../../../services/addons/getAddons'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { SocketContext } from '/src/context/websocketContext'
import { rcompare } from 'semver'
import { InputSwitch, InputText, VersionSelect } from '@ynput/ayon-react-components'
import { FilePath } from './Bundles.styled'
import useCreateContext from '/src/hooks/useCreateContext'
import { useNavigate } from 'react-router'

const AddonListItem = ({ version, setVersion, selection, addons = [], versions }) => {
  const options = useMemo(
    () =>
      selection.length > 1
        ? selection.map((s) => {
            const foundAddon = addons.find((a) => a.name === s.name)
            if (!foundAddon) return ['NONE']
            const versionList = Object.keys(foundAddon.versions || {})
            versionList.sort((a, b) => rcompare(a, b))
            return [...versionList, 'NONE']
          })
        : [[...versions.sort((a, b) => rcompare(a, b)), 'NONE']],

    [selection, addons],
  )

  return (
    <VersionSelect
      style={{ width: 200, height: 32 }}
      buttonStyle={{ zIndex: 0 }}
      versions={options}
      value={version ? [version] : []}
      placeholder="NONE"
      onChange={(e) => setVersion(e[0])}
    />
  )
}

const BundlesAddonList = React.forwardRef(
  (
    {
      formData,
      setFormData,
      readOnly,
      selected = [],
      setSelected,
      style,
      diffAddonVersions,
      isDev,
      onDevChange,
    },
    ref,
  ) => {
    const navigate = useNavigate()

    const { data: addons = [], refetch } = useGetAddonListQuery({
      showVersions: true,
    })

    const readyState = useContext(SocketContext).readyState
    useEffect(() => {
      refetch()
    }, [readyState])

    // every time readyState changes, refetch selected addons

    const onSetVersion = (addonName, version) => {
      const versionsToSet = selected.length > 1 ? selected.map((s) => s.name) : [addonName]

      setFormData((prev) => {
        const newFormData = { ...prev }
        const addons = { ...(newFormData.addons || {}) }

        for (const addon of versionsToSet) {
          addons[addon] = version === 'NONE' ? undefined : version
        }
        newFormData.addons = addons
        return newFormData
      })
    }

    const addonsTable = useMemo(() => {
      return addons.map((addon) => {
        return {
          ...addon,
          version: formData?.addons?.[addon.name] || 'NONE',
          dev: formData?.addonDevelopment?.[addon.name],
        }
      })
    }, [addons, formData])

    const createContextItems = (selected) => {
      let items = [
        {
          label: 'View in Market',
          icon: 'store',
          command: () => navigate(`/market/?addon=${selected.name}`),
        },
      ]

      return items
    }

    const [ctxMenuShow] = useCreateContext([])

    const handleContextClick = (e) => {
      let contextSelection = []
      // is new click not in original selection?
      if (selected.name !== e.data.name) {
        // then update selection to new click
        setSelected(e.data)
        contextSelection = e.data
      } else {
        contextSelection = selected
      }

      ctxMenuShow(e.originalEvent, createContextItems(contextSelection))
    }

    return (
      <DataTable
        value={addonsTable}
        scrollable
        scrollHeight="flex"
        selectionMode="multiple"
        responsive="true"
        dataKey="name"
        selection={selected}
        onSelectionChange={(e) => setSelected(e.value)}
        onContextMenu={handleContextClick}
        tableStyle={{ ...style }}
        className="addons-table"
        rowClassName={(rowData) => diffAddonVersions?.includes(rowData.name) && 'diff-version'}
        ref={ref}
      >
        <Column
          header="Name"
          field="name"
          style={{ padding: '8px !important', maxWidth: isDev ? 250 : 'unset' }}
          bodyStyle={{ height: 38 }}
          sortable
        />
        <Column
          sortable
          field="version"
          header="Version"
          style={{ maxWidth: 200 }}
          bodyStyle={{ padding: 8 }}
          body={(addon) => {
            if (readOnly) return formData?.addons?.[addon.name] || 'NONE'
            // get all selected versions
            return (
              <AddonListItem
                key={addon.name}
                addonTitle={addon.title}
                version={addon.version}
                selection={selected}
                addons={addons}
                setVersion={(version) => onSetVersion(addon.name, version)}
                versions={Object.keys(addon.versions || {})}
                isDev={isDev}
              />
            )
          }}
        />
        {isDev && (
          <Column
            field="path"
            header="Addon directory"
            body={(addon) => (
              <FilePath>
                <InputSwitch
                  checked={addon.dev?.enabled}
                  onChange={() =>
                    onDevChange([addon.name], { value: !addon.dev?.enabled, key: 'enabled' })
                  }
                />
                <InputText
                  value={addon.dev?.path}
                  style={{ width: '100%' }}
                  placeholder="/path/to/dev/addon..."
                  onChange={(e) =>
                    onDevChange([addon.name], { value: e.target.value, key: 'path' })
                  }
                  disabled={!addon.dev?.enabled}
                />
              </FilePath>
            )}
          />
        )}
      </DataTable>
    )
  },
)

// displayName
BundlesAddonList.displayName = 'BundlesAddonList'

export default BundlesAddonList
