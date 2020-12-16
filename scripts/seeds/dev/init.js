let {
  admin,
  adminKeys,
  project,
  projectKeys
} = require('../data/projects')

let { adminUser, getUsers } = require('../data/users')

exports.seed = async function(knex) {
  console.log('Delete Projects')
  await knex('projects').del()
 
  console.log('Insert Projects')
  await knex('projects').insert([
    admin,
    project
  ])

  console.log('Insert Keys')
  await knex('project_keys').insert([
    adminKeys,
    projectKeys
  ])


  console.log('Insert users')
  await knex('users').insert([
    ...getUsers(1000),
    adminUser,
  ])
};
