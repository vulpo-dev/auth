import { project } from '@seeds/data/projects'

export let PROJECT_ID = process.env.PROJECT_ID ?? project.id
export let SERVER_URL = process.env.SERVER_URL ?? "http://localhost:8000"