import Button from "react-bootstrap/Button"
import Container from 'react-bootstrap/Container'
import Form from "react-bootstrap/Form"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import { useNavigate } from "react-router-dom"
import { FaCog, FaFilter, FaBookOpen, FaEyeSlash, FaPlus, FaCheck, FaCode, FaRegTrashAlt, FaArrowUp, FaArrowDown, FaUndo, FaRedo, FaBook, FaPencilAlt, FaTrash, FaTrashAlt } from "react-icons/fa"
import { BsReplyFill, BsChatLeftText, BsGlobe } from "react-icons/bs"
import { Link, useParams } from "react-router-dom";
import Pagination from 'react-bootstrap/Pagination';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ButtonGroup from 'react-bootstrap/ButtonGroup';


import React, { setState, useEffect, useState, formData, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { FormLabel, OverlayTrigger, Tooltip } from "react-bootstrap"
import { fetchSomeAPI, fetchProject, fetchStrings, fetchString, fetchSection } from "../APIController"

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

	const page_size = 50
	const max_page_counter = 11

	const { user } = useContext(AuthContext);

	const [strings, setStrings] = useState([]);
	const [drawStrings, setDrawStrings] = useState([]);

	const [curString, setCurString] = useState(null)
	const [curStringIndex, setCurStringIndex] = useState(-1)

	const [translations, setCurTranslations] = useState([]);

	const [curPage, setCurPage] = useState(1)
	const [maxPage, setMaxPage] = useState(1)
	const [middlePage, setMiddlePage] = useState(1)

	const [inputTranslation, setInputTranslation] = useState("");
	const [translationEdit, setTranslationEdit] = useState(null)
	
	const translationChange = event => setInputTranslation(event.target.value);

	const [project, setProject] = useState({});
	const [section, setSection] = useState({});
	const [members, setMembers] = useState([]);
	const [roles, setRoles] = useState([]);
	const [userRole, setUserRole] = useState(null);

	useEffect(() => {
		console.log(translations)
	}, [translations])

	const link = useParams()

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

			setSection(await fetchSection(link["project_id"], link["section_id"]))
        } catch (err) {
            console.log(err)
            if (err.status == 404) {
                window.location.href = "/404"
            }
            if (err.status == 403) {
                window.location.href = "/403"
            }
        }
    }

	async function GetUserRole() {
        if (!user)
            return
        if (!members)
            return

		console.log(members)
        const member = members.find(member => member.user.id == user?.id)
        if (!member) {
            setUserRole(null)
            return
        }

        setUserRole(roles[member.role_id])
    }

	useEffect(() => {
        GetProject();
    }, []);

	useEffect(() => {
        GetUserRole();
    }, [project, user]);

	async function GetStrings() {
		try {
			let strings = await fetchStrings(link["project_id"], link["section_id"], true, true)
			
			for (let i = 0; i < strings.length; i++) {
				strings[i].index = i
			}
			console.log(strings)

			setMaxPage(Math.max(1, Math.ceil(strings.length / page_size)))

			setStrings(strings)
			setDrawStrings(strings)
		} catch (err) {
			console.log(err)
		}
	}

	useEffect(() => {
		GetStrings()
	}, [])

	useEffect(() => {
		setTranslationEdit(null)
		setInputTranslation("")
	}, [curStringIndex])

	async function UpdateStrings() {
		setStrings(strings)
		setDrawStrings(strings)
	}

	async function UpdateTranslation() {
		// console.log(translation)
		// console.log(curString)
		// curString.translations[curString.translations.findIndex((el) => el.id == translation.id)] = translation
		const str = await fetchString(link["project_id"], link["section_id"], curString.id, true, true)
		strings[curStringIndex] = {...str, index: curString.index}
		setCurString(strings[curStringIndex])
		UpdateStrings()
	}

	async function ChangePage(page) {
		setCurPage(page)
		setMiddlePage(page)
		setCurStringIndex(-1)
		setCurString(null)
	}

	async function AddTranslation() {
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations`, "POST", { "text": inputTranslation })
			UpdateTranslation()
		} catch (err) {
			console.log(err)
		}
	}
	
	async function DeleteTranslation(string_id, translation_id) {
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${string_id}/translations/${translation_id}`, "DELETE")
			UpdateTranslation()
		} catch (err) {
			console.log(err)
		} 
	}
	
	async function EditTranslation() {
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations/${translationEdit.id}`, "PATCH", { "text": inputTranslation })
			UpdateTranslation()
		} catch (err) {
			console.log(err)
		} 
	}

	async function ChangeVote(translation_id, is_voted, is_minus) {
		try {
			const tr = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations/${translation_id}/
			${is_voted ? "unvote" : "vote"}	
			`, "POST", { "is_minus": is_minus },)

			UpdateTranslation(tr)
		} catch (err) {
			console.log(err)
		} 
	}

	async function ChangeApprove(translation_id, approve = true) {
		try {
			const tr = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations/${translation_id}/
			${approve ? "approve" : "unapprove"}	
			`, "POST")

			UpdateTranslation(tr)
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
						<h3 className="pt-1">Раздел: {section.name}</h3>
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
						<LinkWithTooltip tooltip="Фильтр" href="#" id="tooltip-settings" where="bottom">
							<Button variant="outline-primary" style={{ marginLeft: "10px" }}><FaFilter style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Режим редактирования" href="#" id="tooltip-settings" where="bottom">
							<Button variant="outline-primary" style={{ marginLeft: "10px" }}><FaPencilAlt style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Словарь" href="#" id="tooltip-settings" where="bottom">
							<Button variant="outline-primary" style={{ marginLeft: "10px" }}><FaBook style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
{/* 

						<Form style={{ marginLeft: "10px" }}>
							<Form.Group controlId="pieceSearch">
								<Form.Control type="search" placeholder="Поиск..." />
							</Form.Group>
						</Form> */}
					</Col>
					<Col className="py-1 d-inline-flex align-items-center">
						<Pagination>
							{ maxPage > max_page_counter
							? 	<>
									<Pagination.Item onClick={(e) => {ChangePage(1)}} active={curPage == 1}>{1}</Pagination.Item>
									{(() => {
										let arr = []
										let left_page = Math.max(2, middlePage - (max_page_counter - 5) / 2)
										let right_page = Math.min(maxPage - 1, middlePage + (max_page_counter - 5) / 2)

																				
										if (right_page - left_page < max_page_counter - 4) {
											if (left_page - 1 < maxPage - right_page) {
												right_page = left_page + (max_page_counter - 4)
											} else {
												left_page = right_page - (max_page_counter - 4)
											}
										}

										if (left_page > 2) 
											arr.push(<Pagination.Prev onClick={(e) => {setMiddlePage(Math.max(1, middlePage - (max_page_counter + 1) / 2))}}/>)

										for (let i = left_page; i <= right_page; i++) {
											arr.push(<Pagination.Item onClick={(e) => {ChangePage(i)}} active={curPage == i}>{i}</Pagination.Item>)
										}
										
										if (right_page < maxPage - 1) 
											arr.push(<Pagination.Next onClick={(e) => {setMiddlePage(Math.min(maxPage, middlePage + (max_page_counter + 1) / 2))}} />)
										return arr
									})()}
									<Pagination.Item onClick={(e) => {ChangePage(maxPage)}} active={curPage == maxPage}>{maxPage}</Pagination.Item>
								</>
							: 	<>
									{
										Array.from(Array(maxPage).keys()).map((el, ind) =>
											<Pagination.Item onClick={(e) => {ChangePage(ind + 1)}} active={curPage == ind + 1}>{ind + 1}</Pagination.Item>
										)
									}
								</>
							}
						</Pagination>
					</Col>
					{/* <Col className="py-1 d-inline-flex align-items-center">
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
					</Col> */}

				</Container>
			</header>

			<Container fluid style={{ marginTop: "130px" }}>
				<Row>
					<Col className="border-bottom" style={{ padding: "0px" }}>
						{drawStrings.slice((curPage - 1) * page_size, curPage * page_size).map((str, i) =>
							<Container onClick={ async (e) => SelectString(str.index) } key={str.id} fluid style={{ margin: "0px", padding: "7px", minHeight: "100px" }} className="py-2 d-flex justify-content-between">
								{/* <Col md="auto" className="d-flex align-items-center" style={{ marginRight: "10px", marginTop: "20px" }}>
									<Form className="d-flex align-items-center">
										<Form.Group className="mb-3" controlId="formBasicCheckbox">
											<Form.Check type="checkbox" />
										</Form.Group>
									</Form>
								</Col> */}
								<Col style={{ marginRight: "10px" }}>
										{/* <Form.Check.Label>{str.key}</Form.Check.Label> */}
										<Form.Control
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
						<h6>Контекст: {curString?.context}</h6>
						{userRole?.permissions?.can_translate &&
						<>
							<Form.Control className="d-flex align-items-start"
								onChange={translationChange}
								as="textarea"
								value={inputTranslation}
								placeholder="Ваш вариант перевода..."
								style={{ marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
							>
							</Form.Control>
						
							{translationEdit 
								? 	<>
										<Button variant="outline-success" style={{ margin: "10px 0px 10px 0px" }} onClick={() => EditTranslation()}><FaPlus style={{ marginBottom: "3px", marginRight: "3px" }} /> Сохранить </Button>
										<Button variant="outline-danger" style={{ margin: "10px 0px 10px 0px" }} onClick={() => {
											setTranslationEdit(null)
											setInputTranslation("")
										}}><FaPlus style={{ marginBottom: "3px", marginRight: "3px" }} /> Отмена </Button>
									</>
								: 	<Button variant="outline-success" style={{ margin: "10px 0px 10px 0px" }} onClick={() => AddTranslation()}><FaPlus style={{ marginBottom: "3px", marginRight: "3px" }} />  Добавить перевод </Button>
							}
						</>
						}
						<h3>Варианты перевода</h3>
						{curString?.translations?.map((tr, i) =>
						<>
							<Container key={tr.id} style={{ border: (tr.id == translationEdit?.id ? "1px solid orange" : "1px solid")}}>
								<Form.Control
									readOnly
									style={{ marginTop: "10px", wordWrap: "break-word" }}
									value={tr.text}
								></Form.Control>
								<div>Автор: {members.find((el) => el.user.id == tr.author_id)?.user?.username || "noname"}</div>
								{ tr.editor_id && 
									<div>Редактор: {members.find((el) => el.user.id == tr.editor_id)?.user?.username || "noname"}</div>
								}
								<div>{new Date(tr.updated_at).toLocaleString()}</div>

								{userRole?.permissions?.can_approve &&
									<Button variant={tr.is_approved ? "success" : "outline-success"} onClick={(e) => ChangeApprove(tr.id, !tr.is_approved)} style={{ marginLeft: "10px" }}><FaCheck style={{ marginBottom: "3px" }} /></Button>
								}

								{(userRole?.permissions?.can_manage_translations || tr.author_id == user?.id) &&
									<>
										<Button variant="outline-primary" onClick={(e) => {
											setInputTranslation(tr.text)
											setTranslationEdit(tr)
										}} style={{ marginLeft: "10px" }}><FaPencilAlt style={{ marginBottom: "3px" }} /></Button>
										
										<Button variant="outline-primary" onClick={(e) => DeleteTranslation(curString.id, tr.id)} style={{ marginLeft: "10px" }}><FaTrashAlt style={{ marginBottom: "3px" }} /></Button>
									</>
								}
								
								<div>
									<DropdownButton as={ButtonGroup} variant="" title={ tr.votes_plus.length }>
									{tr.votes_plus.map((vote) => 
										<Dropdown.Item href={"/users/" + vote.id}>
										{vote.username}
										</Dropdown.Item>
									)}
									</DropdownButton>

									<Button disabled={!userRole?.permissions?.can_translate} variant={tr.votes_plus.find((el) => el.id == user?.id) ? "success" : "outline-success"} onClick={(e) => ChangeVote(tr.id, !!tr.votes_plus.find((el) => el.id == user?.id), false)}><FaArrowUp style={{ marginBottom: "3px" }}/></Button>

									<Button disabled={!userRole?.permissions?.can_translate} variant={tr.votes_minus.find((el) => el.id == user?.id) ? "danger" : "outline-danger"} onClick={(e) => ChangeVote(tr.id, !!tr.votes_minus.find((el) => el.id == user?.id), true)}><FaArrowDown style={{ marginBottom: "3px" }}/></Button>

									<DropdownButton as={ButtonGroup} variant="" title={ tr.votes_minus.length }>
									{tr.votes_minus.map((vote) => 
										<Dropdown.Item href={"/users/" + vote.id}>
											{vote.username}
										</Dropdown.Item>
									)}
									</DropdownButton>
								</div>
							</Container>
						</>
						)}
					</Col>
				</Row>
			</Container>
		</>
	);
}