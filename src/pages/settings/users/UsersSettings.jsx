import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { Button, Section, Toolbar, InputText } from '@ynput/ayon-react-components'
// Comps
import NewUserDialog from './newUserDialog'
import SetPasswordDialog from './SetPasswordDialog'
import RenameUserDialog from './RenameUserDialog'
// utils
import './users.scss'
import useSearchFilter from '/src/hooks/useSearchFilter'
import { useGetUsersQuery } from '../../../services/user/getUsers'
import { useGetRolesQuery } from '/src/services/getRoles'
import ProjectList from '/src/containers/projectList'
import UserDetail from './userDetail'
import UserList from './UserList'
import { useDeleteUserMutation } from '/src/services/user/updateUser'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { SelectButton } from 'primereact/selectbutton'
import { useSelector } from 'react-redux'

// TODO: Remove classname assignments and do in styled components
const formatRoles = (rowData, selectedProjects) => {
  let res = {}
  if (rowData.isAdmin) res.admin = { cls: 'role admin' }
  else if (rowData.isService) res.service = { cls: 'role manager' }
  else if (rowData.isManager) res.manager = { cls: 'role manager' }
  else if (!selectedProjects) {
    for (const name of rowData.defaultRoles || []) res[name] = { cls: 'role default' }
  } else {
    const roleSet = JSON.parse(rowData.roles)
    for (const projectName of selectedProjects) {
      for (const roleName of roleSet[projectName] || []) {
        if (roleName in res) res[roleName].count += 1
        else res[roleName] = { count: 1 }
        res[roleName].cls =
          res[roleName].count === selectedProjects.length ? 'role all' : 'role partial'
      }
    }
  }

  return { ...rowData, roles: res, rolesList: Object.keys(res) }
}

const UsersSettings = () => {
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showRenameUser, setShowRenameUser] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [userDetailData, setUserDetailData] = useState({})
  // show users for selected projects
  const [showProjectUsers, setShowProjectUsers] = useState(false)

  // get user name from redux
  const selfName = useSelector((state) => state.user.name)
  const isSelfSelected = selectedUsers.includes(selfName)

  // RTK QUERY HOOKS
  const { data: userList = [], isLoading, isError, isFetching } = useGetUsersQuery({ selfName })
  if (isError) toast.error('Unable to load users')

  const {
    data: rolesList = [],
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
  } = useGetRolesQuery()
  if (isErrorRoles) toast.error('Unable to load roles')

  // MUTATION HOOK
  const [deleteUser] = useDeleteUserMutation()

  let filteredUserList = useMemo(() => {
    // filter out users that are not in project if showProjectUsers is true
    if (showProjectUsers && selectedProjects) {
      return userList.filter((user) => {
        // user level not user
        if (user.isManager || user.isAdmin || user.isService) return true

        // check user has role in selected projects
        const roleSet = JSON.parse(user.roles)
        let hasRole = selectedProjects.some((project) => roleSet[project]?.length)

        return hasRole
      })
    } else {
      return userList
    }
  }, [userList, selectedProjects, showProjectUsers])

  // TODO: RTK QUERY
  const onDelete = async () => {
    confirmDialog({
      message: `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
      header: 'Delete users',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        for (const user of selectedUsers) {
          try {
            await deleteUser({ user }).unwrap()
            toast.success(`Deleted user: ${user}`)
          } catch {
            toast.error(`Unable to delete user: ${user}`)
          }
        }
      },
      reject: () => {},
    })
  }

  let userListWithRoles = useMemo(
    () => filteredUserList.map((user) => formatRoles(user, selectedProjects)),
    [filteredUserList, selectedProjects],
  )

  const searchableFields = ['name', 'attrib.fullName', 'attrib.email', 'rolesList', 'hasPassword']

  const [search, setSearch, filteredData] = useSearchFilter(searchableFields, userListWithRoles)

  // Render

  // return null

  // log first user
  console.log(filteredData[0])

  return (
    <main>
      <ConfirmDialog />
      <Section>
        <Toolbar>
          <Button onClick={() => setShowNewUser(true)} label="Add New User" icon="person_add" />
          <Button
            onClick={onDelete}
            label="Delete Users"
            icon="person_remove"
            disabled={!selectedUsers.length || isSelfSelected}
          />
          <SelectButton
            value={showProjectUsers}
            options={[
              { label: 'All Users', value: false },
              { label: 'Selected Projects', value: true },
            ]}
            onChange={(e) => setShowProjectUsers(e.value)}
            disabled={!selectedProjects}
          />
          <InputText
            style={{ width: '200px' }}
            placeholder="Filter users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Toolbar>
        <Splitter
          style={{ width: '100%', height: '100%' }}
          layout="horizontal"
          stateKey="users-panels"
          stateStorage="local"
        >
          <SplitterPanel size={10}>
            <ProjectList
              showNull="( default )"
              multiselect={true}
              selection={selectedProjects}
              onSelect={setSelectedProjects}
              style={{ maxWidth: 'unset' }}
              className="wrap"
            />
          </SplitterPanel>
          <SplitterPanel size={50}>
            <UserList
              userList={userList}
              tableList={filteredData}
              onSelectUsers={setSelectedUsers}
              isFetching={isFetching}
              setUserDetailData={setUserDetailData}
              {...{
                selectedProjects,
                selectedUsers,
                rolesList,
                setShowSetPassword,
                setShowRenameUser,
                onDelete,
                isLoading,
                isLoadingRoles,
                isSelfSelected,
              }}
            />
          </SplitterPanel>
          <SplitterPanel size={40} style={{ minWidth: 370 }}>
            <UserDetail
              userList={userList}
              setShowRenameUser={setShowRenameUser}
              selectedUsers={selectedUsers}
              setShowSetPassword={setShowSetPassword}
              selectedProjects={selectedProjects}
              userDetailData={userDetailData}
              setSelectedUsers={setSelectedUsers}
              isSelfSelected={isSelfSelected}
            />
          </SplitterPanel>
        </Splitter>
      </Section>

      {showNewUser && (
        <NewUserDialog
          rolesList={rolesList}
          onHide={(newUsers) => {
            setShowNewUser(false)
            if (newUsers.length) setSelectedUsers(newUsers)
          }}
        />
      )}

      {showRenameUser && (
        <RenameUserDialog
          selectedUsers={selectedUsers}
          onHide={() => setShowRenameUser(false)}
          onSuccess={(name) => setSelectedUsers([name])}
        />
      )}

      {showSetPassword && (
        <SetPasswordDialog
          selectedUsers={selectedUsers}
          onHide={() => {
            setShowSetPassword(false)
          }}
        />
      )}
    </main>
  )
}

export default UsersSettings
