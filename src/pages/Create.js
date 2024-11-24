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

const errors_to_message = {
    name: {
        "required": "Поле названия проекта должно быть заполнено",
        "not unique": "Название проекта должно быть уникально",
		"minlength": "Название проекта слишком короткое (не меньше 4 символов)",
        "maxlength": "название проекта слишком длинное (не больше 100 символов)",
    },
    handle: {
		"required": "Поле хэндла проекта должно быть заполнено",
		"not unique": "Хэндл проекта должен быть уникальным",
		"minlength": "Хэндл проекта слишком короткий (не меньше 4 символов)",
        "maxlength": "Хэндл проекта слишком длинное (не больше 100 символов)",
        "illegal symbols": "Хэндл проекта должен состоять только из строчных букв латинского алфавита, цифр и знака подчёркивания, а также не начинаться с цифры",
    },
	description: {
		"maxlength": "Описание проекта не должно превышать 1000 символов",
	}
}


export default function Create() {

	const { user } = useContext(AuthContext);

	var id = 0 // ВРЕМЕННАЯ ФИГНЯ, ПОТОМ ПЕРЕДЕЛАТЬ
	let navigate = useNavigate();
	const routeChange = () => {
		let path = '/project/:id';
		navigate(path);
	}

	const [name, setName] = useState("")
	const [handle, setHandle] = useState("")
	const [description, setDescription] = useState("")

	const [langSource, setLangSource] = useState("en")
	const [langTarget, setLangTarget] = useState("ru")

	const [visibility, setVisibility] = useState("private")

	const [error, setError] = useState("")

	const [handleError, setHandleError] = useState("")
	const [nameError, setNameError] = useState("")
	const [descriptionError, setDescriptionError] = useState("")

	const handleChange = event => setHandle(event.target.value);
	const desciptionChange = event => setDescription(event.target.value);

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
			})

			window.location.href = `/projects/${project.id}`
		} catch (err) {
			event.target.disabled = false
			for (const error of err.errors) {
				switch (error.key) {
					case "name":
						setNameError(errors_to_message.name[error.kind] || "Какая-то ошибка")
						break;
					case "handle":
						setHandleError(errors_to_message.handle[error.kind] || "Какая-то ошибка")
						break;
					case "description":
						setDescriptionError(errors_to_message.description[error.kind] || "Какая-то ошибка")
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

			<Container className="text-left mt-5 mx-auto" style={{width: '40%', minWidth: '300px' }}>
				<h1 style={{ marginBottom: '20px' }}>Создать новый проект</h1>
				<Form>
					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputName">Название проекта</Form.Label>
						<Form.Control type="text" id="inputName" onChange={nameChange} aria-describedby="nameError" required/>
						{nameError != "" && <Form.Text id="nameError">
                            {nameError}
                        </Form.Text>}
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputHandle">Уникальная ссылка</Form.Label>
						<Form.Control type="text" id="inputHandle" aria-describedby="linkDesc handleError" onChange={handleChange} required/>
						{/* <Form.Text id="linkDesc">Можно придумать позже</Form.Text> */}
						{handleError != "" && <Form.Text id="handleError">
                            {handleError}
                        </Form.Text>}
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputDesc">Описание проекта</Form.Label>
						<Form.Control as="textarea" type="text" id="inputDesc" aria-describedby="descriptionError" onChange={desciptionChange} />
						{descriptionError != "" && <Form.Text id="descriptionError">
                            {descriptionError}
                        </Form.Text>}
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label htmlFor="inputSrcLang">Язык оригинала</Form.Label>
						<Form.Select id="inputSrcLang" defaultValue="en" onChange={(e) => setLangSource(e.target.value)}>
							<option value="ru">Русский</option>
							<option value="en">Английский</option>
							<option value="de">Немецкий</option>
							<option value="fr">Французский</option>
						</Form.Select>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label className="mt-2" htmlFor="inputTargLang">Язык перевода</Form.Label>
						<Form.Select id="inputTargLang" defaultValue="ru" onChange={(e) => setLangTarget(e.target.value)}>
							<option value="ru">Русский</option>
							<option value="en">Английский</option>
							<option value="de">Немецкий</option>
							<option value="fr">Французский</option>
						</Form.Select>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label className="mt-2" htmlFor="inputLogo">Загрузить обложку</Form.Label>
						<Form.Control type="file" id="inputLogo" accept="image/png, image/jpeg" aria-describedby="logo-desc" />
						<Form.Text id="logo-desc">Принимаются картинки в формате png и jpeg</Form.Text>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label className="mt-2">Доступ к проекту</Form.Label>
						<Form.Select id="inputVisibility" defaultValue="private" onChange={(e) => setVisibility(e.target.value)}>
							<option value="private">Приватный</option>
							<option value="public">Публичный</option>
						</Form.Select>
					</Form.Group>
					
					<Button variant="primary"
						className="mt-3"
						onClick={CreateProject}>
						Создать проект
					</Button>
				</Form>
			</Container>

			<Footer />
		</>
	);
}