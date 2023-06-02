import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import UserDetailsHeader from '/src/components/User/UserDetailsHeader'
import {
  Divider,
  Dropdown,
  FormLayout,
  FormRow,
  InputSwitch,
  OverflowField,
  Panel,
} from '@ynput/ayon-react-components'

const getFieldValues = (users, field, selectedTeams) => {
  let values = []
  let isMultiple = false

  users.forEach((user, i) => {
    // get all values for each team user is in
    const userValues = []
    for (const teamName in user.teams) {
      // check if team is selected
      if (selectedTeams && !selectedTeams.includes(teamName)) continue
      // get team object
      const team = user.teams[teamName]
      if (!team) continue
      // get field value
      const value = field ? team[field] : teamName
      if (value === undefined || value === null) continue

      //   if value is an array, add each value to userValues
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (!userValues.includes(v)) {
            userValues.push(v)
          }
        })
      } else {
        userValues.push(value)
      }
    }

    //   add values to final values array (no duplicates)
    userValues.forEach((value) => {
      if (!values.includes(value)) {
        values.push(value)
      }
    })

    //   check if value is ever different
    if (users.length > 1 && i > 0 && !isMultiple) {
      //  if not, set isMultiple to true
      isMultiple = !(
        values.every((v) => userValues.includes(v)) && values.length === userValues.length
      )
    }
  })

  return [values, isMultiple]
}

const TeamUsersDetails = ({
  users = [],
  teams = [],
  selectedTeams = [],
  rolesList = [],
  onUpdateTeams,
  isFetching,
}) => {
  // STATES
  const [leader, setLeader] = useState(false)

  const noUsers = users.length === 0

  // filter out selectedTeams no users are on
  const usersOnTeams = selectedTeams.filter((team) => users.some((user) => user.teams[team]))

  const disableForm = noUsers || !usersOnTeams.length || isFetching

  const [teamsValue, teamMultiple] = useMemo(() => getFieldValues(users), [users])

  const [rolesValue, rolesMultiple] = useMemo(
    () => getFieldValues(users, 'roles', selectedTeams),
    [users, selectedTeams],
  )

  const [leaderValue, leaderMultiple] = useMemo(
    () => getFieldValues(users, 'leader', selectedTeams),
    [users, selectedTeams],
  )

  const rolesOptions = useMemo(() => rolesList.map((role) => ({ name: role })), [rolesList])

  const formSubtitle = noUsers
    ? 'No Users Selected'
    : usersOnTeams.length
    ? 'Setting On Team' + (usersOnTeams.length > 1 ? 's' : '') + ': ' + usersOnTeams.join(', ')
    : `Not on ${selectedTeams.join(', ')}`

  const subTitle =
    users.length > 1
      ? users.map((user) => user.name).join(', ')
      : teamsValue.length
      ? teamsValue.join(', ')
      : 'No team'

  const leaderInit = leaderValue.some((v) => v) && !leaderMultiple
  // EFFECTS
  // set initial leader state
  useEffect(() => {
    setLeader(leaderInit)
  }, [leaderInit, leaderMultiple, setLeader])

  //   HANDLERS

  // ON TEAMS DROPDOWN CHANGE
  const handleTeamChange = (newTeams = []) => {
    const addedTeams = newTeams.filter((team) => !teamsValue.includes(team))
    const removedTeams = teamsValue.filter((team) => !newTeams.includes(team))

    // add/remove all users to teams
    const updatedTeamsWithNewMembers = []
    teams.forEach((team) => {
      // remove out the selected users from the team
      const membersWithRemovedUsers = team.members.filter(
        (member) => !users.some((user) => user.name === member.name),
      )

      if (addedTeams.includes(team.name)) {
        // create new users array with updated roles and leader
        // if user is already on team, keep their roles and leader
        const newUsersToAdd = users.map((user) => ({
          name: user.name,
          leader: false,
          roles: [],
        }))

        // now merge new users with existing team members
        const newMembers = [...membersWithRemovedUsers, ...newUsersToAdd]

        // add selected members to new team
        updatedTeamsWithNewMembers.push({
          name: team.name,
          members: newMembers,
        })
      } else if (removedTeams.includes(team.name)) {
        // remove members from team
        updatedTeamsWithNewMembers.push({
          name: team.name,
          members: membersWithRemovedUsers,
        })
      }
    })

    onUpdateTeams(updatedTeamsWithNewMembers)
  }

  // ROLES DROPDOWN CHANGE
  const handleRolesChange = (newRoles = []) => {
    // removed roles
    const removedRoles = rolesValue.filter((role) => !newRoles.includes(role))
    // added roles
    const addedRoles = newRoles.filter((role) => role && !rolesValue.includes(role))

    // no changes to roles return
    if (!removedRoles.length && !addedRoles.length) return

    const updatedTeamsWithNewRoles = []
    // for each team and each user, update roles
    teams.forEach((team) => {
      // if team is not selected, skip
      if (!usersOnTeams.includes(team.name)) return

      const updatedMembers = team.members.map((member) => {
        // if user is not selected, keep their roles
        if (!users.some((user) => user.name === member.name)) {
          return member
        } else {
          // otherwise, update their roles
          return {
            ...member,
            roles: member.roles.filter((role) => !removedRoles.includes(role)).concat(addedRoles),
          }
        }
      })

      const teamPatch = { name: team.name, members: updatedMembers }

      updatedTeamsWithNewRoles.push(teamPatch)
    })

    onUpdateTeams(updatedTeamsWithNewRoles)
  }

  // LEADER CHECKBOX CHANGE
  const handleLeaderChange = (e) => {
    // make local state change for faster UI
    setLeader(e.target.checked)

    const value = e.target.checked
    const updatedTeamsWithNewLeaders = []
    // for each team and each user, update roles
    teams.forEach((team) => {
      // if team is not selected, skip
      if (!usersOnTeams.includes(team.name)) return

      const updatedMembers = []

      team.members.forEach((member) => {
        // if user is not selected, keep their roles
        if (!users.some((user) => user.name === member.name)) {
          updatedMembers.push(member)
          return
        } else {
          // otherwise, update their roles
          updatedMembers.push({
            ...member,
            leader: value,
          })
        }
      })

      const newTeam = { name: team.name, members: updatedMembers }

      updatedTeamsWithNewLeaders.push(newTeam)
    })

    onUpdateTeams(updatedTeamsWithNewLeaders)
  }

  return (
    <>
      <Panel>
        <h2 style={{ marginTop: 0 }}>Member Settings</h2>
        <UserDetailsHeader
          users={users}
          style={{ flex: 'unset', padding: 0 }}
          subTitle={<OverflowField value={subTitle} align="left" />}
        />
        <Divider style={{ margin: '10px 0' }} />
        <FormLayout>
          <FormRow label="On Teams" style={{ overflow: 'hidden' }}>
            <Dropdown
              value={teamsValue}
              options={teams}
              dataKey="name"
              widthExpand
              multiSelect
              isMultiple={teamMultiple}
              disabled={noUsers || isFetching}
              onChange={handleTeamChange}
            />
          </FormRow>
          <h2>{formSubtitle}</h2>
          <FormRow label="Roles" style={{ overflow: 'hidden' }}>
            <Dropdown
              value={rolesValue}
              options={rolesOptions}
              dataKey="name"
              widthExpand
              multiSelect
              isMultiple={rolesMultiple}
              disabled={disableForm}
              search
              searchFields={['name']}
              onChange={handleRolesChange}
              valueTemplate={'tags'}
              editable
              placeholder="Add a Role..."
            />
          </FormRow>
          <FormRow label="Leader" style={{ overflow: 'hidden' }}>
            <InputSwitch checked={leader} onChange={handleLeaderChange} disabled={disableForm} />
          </FormRow>
        </FormLayout>
      </Panel>
    </>
  )
}

TeamUsersDetails.propTypes = {
  selectedTeams: PropTypes.arrayOf(PropTypes.string),
  rolesList: PropTypes.arrayOf(PropTypes.string),
}

export default TeamUsersDetails
