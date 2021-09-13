import React from 'react'
import styled from 'styled-components'
import { CreateUser } from 'user/create'
import { NewUser } from 'data/user/types'
import { Header, Wrapper, Content } from 'setup'
import { Story, Meta } from '@storybook/react/types-6-0';
import { action } from '@storybook/addon-actions';
import { Drawer } from '@biotic-ui/drawer'
import { useForm } from '@biotic-ui/std'

export default {
  title: 'User/Create',
  component: CreateUser,
  argTypes: {},
} as Meta;

export let Form: Story = () => {
  let [form, setForm] = useForm<NewUser>({
    email: '',
    type: 'link',
    password: '',
  })

  return (
    <Drawer  open left={false} maxWidth={600} onClose={() => {}}>
      <CreateUser
        form={form}
        onChange={setForm}
        onSubmit={action('submit')}
        passwordless={false}
      />
    </Drawer>
  )
};

export let Passwordless: Story = () => {
  let [form, setForm] = useForm<NewUser>({
    email: '',
    type: 'link',
    password: '',
  })

  return (
    <Drawer  open left={false} maxWidth={600} onClose={() => {}}>
      <CreateUser
        form={form}
        onChange={() => {}}
        onSubmit={action('submit')}
        passwordless
      />
    </Drawer>
  )
};


export let Password: Story = () => {
  let [form, setForm] = useForm<NewUser>({
    email: '',
    type: 'password',
    password: '',
  })

  return (
    <Drawer  open left={false} maxWidth={600} onClose={() => {}}>
      <CreateUser
        form={form}
        onChange={() => {}}
        onSubmit={action('submit')}
        passwordless
      />
    </Drawer>
  )
};


let FormWrapper = styled.div`
  background: #fff;
  max-width: 600px;
  height: 100%;
  margin-left: auto;
`