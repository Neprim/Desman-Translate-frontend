import Button from "react-bootstrap/Button"
import Container from 'react-bootstrap/Container'
import Form from "react-bootstrap/Form"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import { useNavigate } from "react-router-dom"
import { FaCog, FaFilter, FaBookOpen, FaEyeSlash, FaPlus, FaCheck, FaCode, FaRegTrashAlt, FaEllipsisV, FaUndo, FaRedo, FaBook } from "react-icons/fa"
import { BsReplyFill, BsChatLeftText, BsGlobe } from "react-icons/bs"
import { Link, useParams } from "react-router-dom";


import React, { setState, useEffect, useState, formData, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import { fetchSomeAPI, fetchProject } from "../APIController"

function LinkWithTooltip({ id, children, href, tooltip, where }) {
	return (
		<OverlayTrigger
			overlay={<Tooltip id={id}>{tooltip}</Tooltip>}
			placement={where}
			delayShow={300}
			delayHide={150}
		>
			<a href={href}>{children}</a>
		</OverlayTrigger>
	);
}





export default function Editor() {

	const { user } = useContext(AuthContext);

	const [strings, setStrings] = useState([]);

	const [curString, setCurString] = useState(null)
	const [curStringIndex, setCurStringIndex] = useState(-1)

	const [translations, setCurTranslations] = useState([]);

	const [inputTranslation, setInputTranslation] = useState("");
	
	const translationChange = event => setInputTranslation(event.target.value);

	const [project, setProject] = useState({});
	const [members, setMembers] = useState({});
	const [roles, setRoles] = useState({});

	useEffect(() => {
		console.log(translations)
	}, [translations])

	const link = useParams()

	function refreshPage() {
		window.location.reload(false);
	}

	let navigate = useNavigate();
	const routeChange = () => {
		let path = '/projects/' + link["project_id"];
		navigate(path);
	}


	async function SelectString(str_index) {
		setCurString(strings[str_index])
		setCurStringIndex(str_index)
	}

	async function GetProject() {
        try {
            let project = await fetchProject(link["project_id"], true, true)
            setProject(project)
            setMembers(project.members)
            setRoles(project.roles)
        } catch (err) {
            console.log(err)
            if (err.status == 404) {
                window.location.href = "/404"
            }
        }
    }

	useEffect(() => {
        GetProject();
    }, []);

	async function GetStrings() {
		try {
			let strings = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings?fetch_translations=1`)

			for (let i = 0; i < strings.length; i++) {
				strings[i].translations.sort((a, b) => (new Date(b.updated_at) - new Date(a.updated_at)))
			}

			setStrings(strings)
		} catch (err) {
			console.log(err)
		}
	}

	useEffect(() => {
		GetStrings()
	}, [])

	async function AddTranslation() {
		const ind = curStringIndex
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations`, "POST", { "text": inputTranslation },)
			const str = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}?fetch_translations=1`)
			console.log(str)
			strings[ind] = str

			setStrings(strings)
			setCurString(strings[ind])
		} catch (err) {
			console.log(err)
		}
	}



	return (
		<>
			<header className="fixed-top" expand="lg">
				<Container fluid className="bg-white py-1 border-bottom d-flex flex-wrap justify-content-between">
					<div className="d-inline-flex align-items-center">
						<LinkWithTooltip tooltip="Вернуться к проекту" href="#" id="tooltip-back" where="bottom">
							<Button variant="outline-dark" onClick={routeChange}><BsReplyFill style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
					</div>
					<div className="d-inline-flex align-items-center">
						<h3 className="pt-1">Проект: Раздел</h3>
					</div>
					<div className="d-inline-flex align-items-center">
						<LinkWithTooltip tooltip="Настройки редактора" href="#" id="tooltip-settings" where="bottom">
							<Button variant="outline-dark"><FaCog style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
					</div>
				</Container>

				<Container fluid
					className="border-bottom bg-white row py-1 d-flex flex-wrap justify-content-between"
					style={{ margin: "0px" }}
				>
					<Col className="py-1 d-inline-flex align-items-center">
						<LinkWithTooltip tooltip="Отменить" href="#" id="tooltip-settings" where="bottom">
							<Button variant="link"><FaUndo style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Повторить" href="#" id="tooltip-settings" where="bottom">
							<Button variant="link"><FaRedo style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Фильтр" href="#" id="tooltip-settings" where="bottom">
							<Button variant="outline-primary" style={{ marginLeft: "10px" }}><FaFilter style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Скрыть исходник" href="#" id="tooltip-settings" where="bottom">
							<Button variant="outline-primary" style={{ marginLeft: "10px" }}><FaCode style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Добавить отрывок" href="#" id="tooltip-settings" where="bottom">
							<Button variant="outline-primary" style={{ marginLeft: "10px" }}><FaPlus style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Словарь" href="#" id="tooltip-settings" where="bottom">
							<Button variant="outline-primary" style={{ marginLeft: "10px" }}><FaBook style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>


						<Form style={{ marginLeft: "10px" }}>
							<Form.Group controlId="pieceSearch">
								<Form.Control type="search" placeholder="Поиск..." />
							</Form.Group>
						</Form>
					</Col>
					<Col></Col>
					<Col className="py-1 d-inline-flex align-items-center">
						<LinkWithTooltip tooltip="Одобрить перевод" href="#" id="tooltip-settings" where="bottom">
							<Button disabled variant="outline-secondary"><FaCheck style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Скрыть отрывок" href="#" id="tooltip-settings" where="bottom">
							<Button disabled variant="outline-secondary" style={{ marginLeft: "10px" }}><FaEyeSlash style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Удалить отрывок" href="#" id="tooltip-settings" where="bottom">
							<Button disabled variant="outline-secondary" style={{ marginLeft: "10px" }}><FaRegTrashAlt style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Прочее" href="#" id="tooltip-settings" where="bottom">
							<Button disabled variant="outline-secondary" style={{ marginLeft: "10px" }}><FaEllipsisV style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Комментарии" href="#" id="tooltip-settings" where="bottom">
							<Button disabled variant="outline-secondary" style={{ marginLeft: "10px" }}><BsChatLeftText style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>

					</Col>

				</Container>
			</header>

			<Container fluid style={{ marginTop: "110px" }}>
				<Row>
					<Col className="border-bottom" style={{ padding: "0px" }}>
						{strings.map((str, i) =>
							<Container key={str.id} fluid style={{ margin: "0px", padding: "7px", minHeight: "100px" }} className="py-2 d-flex justify-content-between">
								<Col md="auto" className="d-flex align-items-center" style={{ marginRight: "10px", marginTop: "20px" }}>
									<Form className="d-flex align-items-center">
										<Form.Group className="mb-3" controlId="formBasicCheckbox">
											<Form.Check type="checkbox" />
										</Form.Group>
									</Form>
								</Col>
								<Col style={{ marginRight: "10px" }} onClick={ async (e) => SelectString(i) }>
									<Form.Control className="d-flex align-items-start"
										readOnly
										as="textarea"
										style={{ paddingTop: "5px", paddingLeft: "10px", height: "100%", wordWrap: "break-word" }}
										value={str.text}
									>	
									</Form.Control>
								</Col>
								<Col>
									<Form.Control className="d-flex align-items-start"
										readOnly
										as="textarea"
										style={{ paddingTop: "5px", paddingLeft: "10px", height: "100%", wordWrap: "break-word" }}
										value={str.translations?.[0]?.text || ""}
									>	
									</Form.Control>
								</Col>
							<hr style={{ padding: "0px", margin: "0px" }} />
							</Container>
						)}


					</Col>
					<Col className="border-start border-end border-bottom" md={4}>
						<Button variant="outline-success" style={{ margin: "10px 0px 10px 0px" }} onClick={() => AddTranslation()}><FaPlus style={{ marginBottom: "3px", marginRight: "3px" }} />  Добавить перевод </Button>
						<Form.Control className="d-flex align-items-start"
							onChange={translationChange}
							as="textarea"
							placeholder="Ваш вариант перевода..."
							style={{ marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
						>
						</Form.Control>

						<h3>Варианты перевода</h3>
						{curString?.translations?.map((tr, i) =>
						<>
							<FloatingLabel controlId="translationVariant" label={members.find((el) => el.user.id == tr.author_id)?.user?.username || "noname"} key={tr.id}>
								<Form.Control
									as="textarea"
									readOnly
									style={{ marginTop: "10px", minHeight: "100px", wordWrap: "break-word" }}
									value={tr.text}
								>
								</Form.Control>
							</FloatingLabel>
						</>
						)}
					</Col>
				</Row>
			</Container>
		</>
	);
}