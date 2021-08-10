import Axios from 'axios'
import { project } from '@seeds/data/projects'

export default Axios.create({
	baseURL: "http://localhost:8000",
	headers: {
		'Bento-Project': project.id
	}
})