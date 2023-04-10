import { project } from '@vulpo-dev/auth-seeds/data/projects'

export let PROJECT_ID = process.env.PROJECT_ID ?? project.id
export let SERVER_URL = process.env.SERVER_URL ?? "http://127.0.0.1:8000"