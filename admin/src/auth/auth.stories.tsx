import React from 'react'
import { Auth } from 'auth'
import { Auth as AuthClient } from '@riezler/auth-react'
import { HashRouter, Route, Redirect, Switch } from 'react-router-dom'
import { Header, Wrapper, Content } from 'setup'
import { Story, Meta } from '@storybook/react/types-6-0';
import { Main } from 'component/layout'


export default {
  title: 'Auth',
  component: Auth,
  argTypes: {},
} as Meta;

const Template: Story<{}> = (args) => {
  return (
    <HashRouter>
      <AuthClient.Provider value={{ signIn: (username: string, password: string) => console.log({ username, password })}}>
        <Main>
          <Header />
          <Wrapper>
            <Switch>
              <Route path='/signin'>
                  <Auth />
              </Route>

              <Redirect to='/signin' />
            </Switch>
          </Wrapper>
        </Main>
      </AuthClient.Provider>
    </HashRouter>
  )
};
export const Default = Template.bind({});