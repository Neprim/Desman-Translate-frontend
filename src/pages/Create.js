import { Link } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"
import Button from "react-bootstrap/Button"
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

	const [langSource, setLangSource] = useState("ru")
	const [langTarget, setLangTarget] = useState("en")

	const [visibility, setVisibility] = useState("private")

	const [error, setError] = useState("")

	const [handleError, setHandleError] = useState("")
	const [nameError, setNameError] = useState("")
	const [descriptionError, setDescriptionError] = useState("")

	const handleChange = event => setHandle(event.target.value);
	const desciptionChange = event => setDescription(event.target.value);

	function translit(str) {
		let letters = {}
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
		letters['Й'] = 'j';     letters['й'] = 'j';  
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
		letters['Ы'] = 'y';     letters['ы'] = 'y';  
		letters['Э'] = 'e';     letters['э'] = 'e';  
		letters['Ю'] = 'yu';    letters['ю'] = 'yu'; 
		letters['Я'] = 'ya';    letters['я'] = 'ya'; 

		str = str.toLowerCase()
		let tr = ""
		for (let i = 0; i < str.length; i++) {
			if (/[a-z]/.test(str[i]))
				tr += str[i]
			else if (letters[str[i]])
				tr += letters[str[i]]
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

			window.location.replace(`/projects/${project.id}`)
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

	return (
		<>
			<Navbar />

			<div className="container text-left" style={{ marginTop: '50px', marginLeft: 'auto', marginRight: 'auto', width: '40%', minWidth: '300px' }}>
				<h1 style={{ marginBottom: '20px' }}>Создать новый проект</h1>
				<form>
					<div className="mb-3">
						
						<label htmlFor="inputName" className="form-label">Название проекта</label>
						<input type="text" className="form-control" id="inputName" onChange={nameChange} aria-describedby="nameError"/>
						{nameError != "" && <div id="nameError" className="form-text">
                            {nameError}
                        </div>}
					</div>
					<div className="mb-3">
						
						<label htmlFor="inputHandle" className="form-label">Уникальная ссылка</label>
						<input type="text" className="form-control" id="inputHandle" aria-describedby="linkDesc handleError" onChange={handleChange} />
						{/* <div id="linkDesc" className="form-text">Можно придумать позже</div> */}
						{handleError != "" && <div id="handleError" className="form-text">
                            {handleError}
                        </div>}
					</div>
					<div className="mb-3">
						
						<label htmlFor="inputDesc" className="form-label">Описание проекта</label>
						<textarea type="text" className="form-control" id="inputDesc" aria-describedby="descriptionError" onChange={desciptionChange} />
						{descriptionError != "" && <div id="descriptionError" className="form-text">
                            {descriptionError}
                        </div>}
					</div>
					<label htmlFor="inputSrcLang" className="form-label">Язык оригинала</label>
					<select className="form-select" id="inputSrcLang" defaultValue="en" onChange={(e) => setLangSource(e.target.value)}>
						<option value="ru">русский</option>
						<option value="en">английский</option>
						<option value="de">немецкий</option>
						<option value="fr">французский</option>
					</select>
					<label htmlFor="inputTargLang" className="form-label" style={{ marginTop: '10px' }}>Язык перевода</label>
					<select className="form-select" id="inputTargLang" defaultValue="ru" onChange={(e) => setLangTarget(e.target.value)}>
						<option value="ru">русский</option>
						<option value="en">английский</option>
						<option value="de">немецкий</option>
						<option value="fr">французский</option>
					</select>
					<label htmlFor="inputLogo" className="form-label" style={{ marginTop: '10px' }}>Загрузить обложку</label>
					<input type="file" className="form-control" id="inputLogo" accept="image/png, image/jpeg" aria-describedby="logo-desc" />
					<div id="logo-desc" className="form-text">Принимаются картинки в формате png и jpeg</div>
					<label className="form-label" style={{ marginTop: '10px' }}>Доступ к проекту</label>
					<div className="form-check">
						<input type="radio" name="radios" className="form-check-input" id="settings-access-private" defaultValue="private" defaultChecked onClick={(e) => setVisibility("private")}/>
						<label className="form-check-label" htmlFor="settings-access-private">Приватный проект</label>
					</div>
					<div className="form-check">
						<input type="radio" name="radios" className="form-check-input" id="settings-access-public" defaultValue="public" onClick={(e) => setVisibility("public")}/>
						<label className="form-check-label" htmlFor="settings-access-public">Публичный проект</label>
					</div>
					
					<Button variant="primary"
						style={{ marginTop: "20px" }}
						onClick={CreateProject}
					>
						Создать проект
					</Button>
					
				</form>
			</div>

			<Footer />
		</>
	);
}