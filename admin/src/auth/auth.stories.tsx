import React from 'react'
import { Auth as AuthComponent } from 'auth'
import { User, Auth, UserState } from '@riezler/auth-sdk'
import { Auth as AuthClient } from '@riezler/auth-react'
import { HashRouter, Route, Navigate, Routes } from 'react-router-dom'
import { Header, Wrapper } from 'setup'
import { Story, Meta } from '@storybook/react/types-6-0';
import { Main } from 'component/layout'


export default {
  title: 'Auth',
  component: AuthComponent,
  argTypes: {},
} as Meta;

let client = Auth.create({
  baseURL: '',
  project: '',
})

let user: User = {
  email: 'sb@vulpo.dev',
  created_at: '',
  data: {},
  email_verified: true,
  id: '',
  provider_id: 'password',
  state: UserState.Active,
  traits: [],
  updated_at: '',
  display_name: '',
  photo_url: '',
  device_languages: [],
}

const Template: Story<{}> = (args) => {

  let signIn = async (username: string, password: string) => {
    console.log({ username, password })
    return user
  }

  return (
    <HashRouter>
      <AuthClient.Provider value={Object.assign(client, { signIn })}>
        <Main>
          <Header />
          <Wrapper>
            <Routes>
              <Route path='/signin' element={<AuthComponent />} />
              <Route element={<Navigate to='/signin' />} />
            </Routes>
          </Wrapper>
        </Main>
      </AuthClient.Provider>
    </HashRouter>
  )
};
export const Default = Template.bind({});