import Axios from 'axios'
import { PROJECT_ID, SERVER_URL } from './env'

export default Axios.create({
	baseURL: SERVER_URL,
	headers: {
		'Bento-Project': PROJECT_ID
	}
})