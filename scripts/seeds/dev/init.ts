require('dotenv').config()

import {
  admin,
  adminKeys,
  adminSettings,

  project,
  projectKeys,
  projectSettings,
} from '../data/projects'


import { email } from '../data/settings'
import { adminUser, getUsers, hash } from '../data/users'
import { Templates } from '../data/template'

import * as Knex from 'knex'
import { v4 as uuid } from 'uuid'

exports.seed = async function(knex: Knex) {
  console.log('Delete Projects')
  await knex('projects').del()
 
  console.log('Insert Projects')
  let projects = [admin, project]
  await knex('projects').insert(projects)

  console.log('Insert Settings')
  await knex('project_settings').insert([
    adminSettings,
    projectSettings,
  ])

  console.log('Insert Email Settings')
  await knex('email_settings').insert([email])

  console.log('Insert Keys')
  await knex('project_keys').insert([
    adminKeys,
    projectKeys
  ])


  let users = getUsers(1000).concat([adminUser])
  console.log('Insert users')
  await knex('users').insert(users)

  console.log('Insert Passwords')
  let password = hash('password')
  await knex('passwords').insert(
    users.map(u => {
      return {
        user_id: u.id,
        alg: 'bcrypt',
        hash: password,
      }
    })
  )

  console.log('Insert Templates')
  let templates = projects.flatMap(project => {
    return Templates.map(template => {
      return { ...template, id: uuid(), project_id: project.id }
    })
  })

  await knex('templates').insert(
    templates.map(t => {
      return {
        id: t.id,
        body: t.body ?? "",
        of_type: t.template_type,
        name: t.of_type,
        project_id: t.project_id,
      }
    })
  )

  await knex('template_data').insert(
    templates.filter(t => t.template_type === 'view').map(t => {
      return {
        template_id: t.id,
        from_name: t.from_name,
        subject: t.subject,
        redirect_to: t.redirect_to,
        of_type: t.of_type,
      }
    })
  )

  console.log('Insert Translations')
  await knex('template_translations').insert(
    templates.filter(t => t.template_type === 'view').map(t => {
      return {
        template_id: t.id,
        language: 'en',
        content: t.translation,
      }
    })
  )
};
