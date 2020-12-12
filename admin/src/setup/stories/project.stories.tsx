import React from 'react'
import { Project } from 'setup/project'
import { Header, Wrapper, Content } from 'setup'
import { Story, Meta } from '@storybook/react/types-6-0';
import { Main } from 'component/layout'

export default {
  title: 'Setup/Project',
  component: Project,
  argTypes: {},
} as Meta;

const Template: Story<{}> = (args) => {
  return (
    <Main>
      <Header />
      <Wrapper>
        <Content>
          <Project {...args} />
        </Content>
      </Wrapper>
    </Main>
  )
};
export const Loading = Template.bind({});