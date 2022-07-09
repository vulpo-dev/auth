import React from 'react'
import { User, Props } from 'setup/user'
import { Header, Wrapper, Content } from 'setup'
import { Story, Meta } from '@storybook/react/types-6-0';
import { Main } from 'component/layout'
import { ApiError } from 'error'

export default {
  title: 'Setup/User',
  component: User,
  argTypes: {
    onSubmit: { action: 'create admin' },
  },
} as Meta;

const Template: Story<Props> = (args) => {
  return (
    <Main>
      <Header />
      <Wrapper>
        <Content>
          <User {...args} />
        </Content>
      </Wrapper>
    </Main>
  )
};

export const Ok = Template.bind({})
Ok.args = { error: null }

export const HasAdmin = Template.bind({})
HasAdmin.args = { error: ApiError.AdminHasAdmin }

export const UserExists = Template.bind({})
UserExists.args = { error: ApiError.UserExists }

export const ProjectNotFound = Template.bind({})
ProjectNotFound.args = { error: ApiError.ProjectNotFound }

export const Error = Template.bind({})
Error.args = { error: ApiError.GenericError }