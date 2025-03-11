import { Link } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import { useNavigate } from "react-router-dom"
import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { fetchSomeAPI } from "../APIController"
import { getLoc } from "../Translation"

const errors_to_message = {
    name: {
        "required": getLoc("create_error_name_required"),
        "not unique": getLoc("create_error_name_not_unique"),
		"minlength": getLoc("create_error_short_name"),
        "maxlength": getLoc("create_error_long_name"),
    },
    handle: {
		"required": getLoc("create_error_handle_required"),
		"not unique": getLoc("create_error_handle_not_unique"),
		"minlength": getLoc("create_error_short_handle"),
        "maxlength": getLoc("create_error_long_handle"),
        "illegal symbols": getLoc("create_error_illegal_symbols_handle"),
    },
	description: {
		"maxlength": getLoc("create_error_long_description"),
	}
}


export default function Create() {

	const { user } = useContext(AuthContext);

	const [name, setName] = useState("")
	const [handle, setHandle] = useState("")
	const [description, setDescription] = useState("")
	const [cover, setCover] = useState("")

	console.log(localStorage.getItem("lang"))

	const [langSource, setLangSource] = useState("en")
	const [langTarget, setLangTarget] = useState(localStorage.getItem("lang") || "ru")

	const [visibility, setVisibility] = useState("private")

	const [error, setError] = useState("")

	const [handleError, setHandleError] = useState("")
	const [nameError, setNameError] = useState("")
	const [descriptionError, setDescriptionError] = useState("")
	const [coverError, setCoverError] = useState("")

	const handleChange = event => setHandle(event.target.value);
	const desciptionChange = event => setDescription(event.target.value);
	const coverChange = event => setCover(event.target.value);

	function translit(str) {
		let letters = {}
		letters[' '] = '_'
		letters['А'] = 'a';     letters['а'] = 'a';  
		letters['Б'] = 'b';     letters['б'] = 'b';  
		letters['В'] = 'v';     letters['в'] = 'v';  
		letters['Г'] = 'g';     letters['г'] = 'g';  
		letters['Д'] = 'd';     letters['д'] = 'd';  
		letters['Е'] = 'e';     letters['е'] = 'e';  
		letters['Ё'] = 'yo';    letters['ё'] = 'yo'; 
		letters['Ж'] = 'zh';    letters['ж'] = 'zh'; 
		letters['З'] = 'z';     letters['з'] = 'z';  
		letters['И'] = 'i';     letters['и'] = 'i';  
		letters['Й'] = 'y';     letters['й'] = 'y';  
		letters['К'] = 'k';     letters['к'] = 'k';  
		letters['Л'] = 'l';     letters['л'] = 'l';  
		letters['М'] = 'm';     letters['м'] = 'm';  
		letters['Н'] = 'n';     letters['н'] = 'n';  
		letters['О'] = 'o';     letters['о'] = 'o';  
		letters['П'] = 'p';     letters['п'] = 'p';  
		letters['Р'] = 'r';     letters['р'] = 'r';  
		letters['С'] = 's';     letters['с'] = 's';  
		letters['Т'] = 't';     letters['т'] = 't';  
		letters['У'] = 'u';     letters['у'] = 'u';  
		letters['Ф'] = 'f';     letters['ф'] = 'f';  
		letters['Х'] = 'x';     letters['х'] = 'x';  
		letters['Ц'] = 'c';     letters['ц'] = 'c';  
		letters['Ч'] = 'ch';    letters['ч'] = 'ch'; 
		letters['Ш'] = 'sh';    letters['ш'] = 'sh'; 
		letters['Щ'] = 'shh';   letters['щ'] = 'shh';
		letters['Ы'] = 'i';     letters['ы'] = 'i';  
		letters['Э'] = 'e';     letters['э'] = 'e';  
		letters['Ю'] = 'yu';    letters['ю'] = 'yu'; 
		letters['Я'] = 'ya';    letters['я'] = 'ya'; 

		str = str.toLowerCase()
		let tr = ""
		for (const ch of str) {
			if (/[a-z0-9]/.test(ch))
				tr += ch
			else if (letters[ch])
				tr += letters[ch]
		}

		return tr
	}

	const nameChange = (event) => {
		const name = event.target.value
		setName(name)

		const tr = translit(name)
		document.getElementById("inputHandle").value = tr
		setHandle(tr)
	}
	
	async function CreateProject(event) {
		try {
			setHandleError("")
			setNameError("")
			setDescriptionError("")
			
			const project = await fetchSomeAPI(`/api/projects`, "POST", {
				"name": name,
				"handle": handle,
				"target_lang": langTarget,
				"source_lang": langSource,
				"visibility": visibility,
				"description": description,
				"cover_url": cover,
			})

			window.location.href = `/projects/${project.id}`
		} catch (err) {
			event.target.disabled = false
			for (const error of err.errors) {
				switch (error.key) {
					case "name":
						setNameError(errors_to_message.name[error.kind] || getLoc("some_error"))
						break;
					case "handle":
						setHandleError(errors_to_message.handle[error.kind] || getLoc("some_error"))
						break;
					case "description":
						setDescriptionError(errors_to_message.description[error.kind] || getLoc("some_error"))
						break;
				}
			}
		}
	}

	useEffect(() => {
		if (user === undefined)	
			return
		if (user === null)
			window.location.href = '/401'
	}, [user])

	return (
		<>
			<Header />
			<title>{getLoc("create_title")}</title>
			<Container className="text-left mt-5 mx-auto" style={{width: '40%', minWidth: '300px' }}>
				<h1 style={{ marginBottom: '20px' }}>{getLoc("create_new_project")}</h1>
				<Form>
					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputName">{getLoc("create_project_name")}</Form.Label>
						<Form.Control type="text" id="inputName" onChange={nameChange} aria-describedby="nameError" required/>
						{nameError != "" && <Form.Text id="nameError">
                            {nameError}
                        </Form.Text>}
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputHandle">{getLoc("create_project_handle")}</Form.Label>
						<Form.Control type="text" id="inputHandle" aria-describedby="linkDesc handleError" onChange={handleChange} required/>
						{handleError != "" && <Form.Text id="handleError">
                            {handleError}
                        </Form.Text>}
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputDesc">{getLoc("create_project_description")}</Form.Label>
						<Form.Control as="textarea" type="text" id="inputDesc" aria-describedby="descriptionError" onChange={desciptionChange} />
						{descriptionError != "" && <Form.Text id="descriptionError">
                            {descriptionError}
                        </Form.Text>}
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputSrcLang">{getLoc("create_project_source_lang")}</Form.Label>
						<Form.Select id="inputSrcLang" defaultValue={langSource} onChange={(e) => setLangSource(e.target.value)}>
							<option value="ru">{getLoc("lang_ru")}</option>
							<option value="en">{getLoc("lang_en")}</option>
						</Form.Select>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label className="mt-2" htmlFor="inputTargLang">{getLoc("create_project_target_lang")}</Form.Label>
						<Form.Select id="inputTargLang" defaultValue={langTarget} onChange={(e) => setLangTarget(e.target.value)}>
						<option value="ru">{getLoc("lang_ru")}</option>
							<option value="en">{getLoc("lang_en")}</option>
						</Form.Select>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputDesc">{getLoc("create_project_cover")}</Form.Label>
						<Form.Control type="text" id="inputName" onChange={coverChange} aria-describedby="coverError" maxLength={1000}/>
						{coverError != "" && <Form.Text id="coverError">
                            {coverError}
                        </Form.Text>}
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label className="mt-2">{getLoc("create_project_visibility")}</Form.Label>
						<Form.Select id="inputVisibility" defaultValue="public" onChange={(e) => setVisibility(e.target.value)}>
							<option value="public">{getLoc("create_project_visibility_private")}</option>
							<option value="private">{getLoc("create_project_visibility_public")}</option>
							<option value="closed">{getLoc("create_project_visibility_closed")}</option>
						</Form.Select>
						<Form.Text id="visibilityDesc">
							<div>{getLoc(`create_project_visibility_${visibility}_description`)}</div>
                        </Form.Text>
					</Form.Group>
					
					<Button variant="primary"
						className="mt-3"
						onClick={CreateProject}>
						{getLoc("create_project_create")}
					</Button>
				</Form>
			</Container>

			<Footer />
		</>
	);
}