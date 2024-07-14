import Button from "react-bootstrap/Button"
import Container from 'react-bootstrap/Container'
import Form from "react-bootstrap/Form"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import { useNavigate } from "react-router-dom"
import { FaCog, FaFilter, FaBookOpen, FaEyeSlash, FaPlus, FaCheck, FaCode, FaRegTrashAlt, FaArrowUp, FaArrowDown, FaUndo, FaRedo, FaBook, FaPencilAlt, FaTrash, FaTrashAlt, FaArrowsAlt } from "react-icons/fa"
import { BsReplyFill, BsChatLeftText, BsGlobe } from "react-icons/bs"
import { Link, useParams } from "react-router-dom";
import Pagination from 'react-bootstrap/Pagination';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Stack from 'react-bootstrap/Stack';
import CloseButton from 'react-bootstrap/CloseButton';
import Spinner from 'react-bootstrap/Spinner';


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



let strings = []

export default function Editor() {

	const page_size = 50
	const max_page_counter = 11

	const { user } = useContext(AuthContext);

	const [drawStrings, setDrawStrings] = useState([]);

	const [curString, setCurString] = useState(null)

	const [curPage, setCurPage] = useState(1)
	const [maxPage, setMaxPage] = useState(1)
	const [middlePage, setMiddlePage] = useState(1)

	const [inputTranslation, setInputTranslation] = useState("");
	const [inputText, setInputText] = useState("");
	const [inputKey, setInputKey] = useState("");
	const [inputContext, setInputContext] = useState("");
	const [inputMaxLength, setInputMaxLength] = useState("");

	const [translationEdit, setTranslationEdit] = useState(null)

	const [filters, setFilters] = useState([])
	
	const translationChange = e => setInputTranslation(e.target.value);
	const textChange 		= e => setInputText(e.target.value);
	const keyChange 		= e => setInputKey(e.target.value);
	const contextChange 	= e => setInputContext(e.target.value);
	const maxLengthChange 	= e => setInputMaxLength(e.target.value);

	const [project, setProject] = useState({});
	const [section, setSection] = useState({});
	const [members, setMembers] = useState([]);
	const [roles, setRoles] = useState([]);
	const [userRole, setUserRole] = useState(null);

	const [loading, setLoading] = useState(false)
	const [editMode, setEditMode] = useState(false)
	const [moveMode, setMoveMode] = useState(false)

	const link = useParams()

	let navigate = useNavigate();
	const routeChange = () => {
		let path = '/projects/' + link["project_id"];
		navigate(path);
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

        const member = members.find(member => member.user.id == user?.id)
        if (!member) {
            setUserRole(null)
            return
        }

        setUserRole(roles[member.role_id])
		console.log(roles[member.role_id])
    }

	useEffect(() => {
        GetProject();
    }, []);

	useEffect(() => {
        GetUserRole();
    }, [project, user]);

	async function GetStrings() {
		setLoading(true)
		try {
			let strs = await fetchStrings(link["project_id"], link["section_id"], true, true)
			let sel = -1

			for (let i = 0; i < strs.length; i++) {
				strs[i].index = i
				if (strs[i].index == window.location.hash.substring(1)) {
					sel = i
					ChangePage(1 + Math.floor(i / page_size))
				}
			}
			console.log(strs)

			setMaxPage(Math.max(1, Math.ceil(strs.length / page_size)))

			strings = strs
			console.log(strings)
			
			UpdateDrawStrings()

			if (sel != -1) {
				SelectString(sel)
				setTimeout(() => {
					let str = document.getElementById('str' + strings[sel].id);
					str.scrollIntoView({ behavior: "smooth" });
				}, 100)
			}
		} catch (err) {
			console.log(err)
		}
		setLoading(false)
	}

	function PreudoReload(sel) {
		setFilters([])

		ChangePage(1 + Math.floor(sel / page_size))

		UpdateDrawStrings()

		console.log("PseudoReload")
		console.log(curPage)

		setTimeout(() => {
			SelectString(sel)
			let str = document.getElementById('str' + strings[sel].id);
			str.scrollIntoView({ behavior: "smooth" });
		}, 100)
	}

	function SelectString(str_index) {
		setCurString(strings[str_index])
	}

	useEffect(() => {
		GetStrings()
	}, [])

	useEffect(() => {
		setTranslationEdit(null)
		setInputTranslation(curString?.text || "")
		setEditMode(false)
		let page = Math.floor((curString?.index || 0) / page_size) + 1
		setCurPage(page)
		setMiddlePage(page)
	}, [curString])

	useEffect(() => {
		let strs = FilterStrings() 
		setDrawStrings(strs)
		setMaxPage(Math.max(1, Math.ceil(strs.length / page_size)))
		setCurString(null)
	}, [filters])

	function UpdateDrawStrings() {
		setDrawStrings(FilterStrings())
	}

	function FilterStrings() {
		let draws = strings.filter((str) => {
			for (let filter of filters) {
				if (filter.is_regex) {
					filter.value = filter.value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
				}
				if (filter.key == "orig") {
					if (!new RegExp(filter.value, 'i').test(str.text))
						return false
				} else 
				if (filter.key == "trans") {
					let flag = false
					for (let tr of str.translations) {
						if (new RegExp(filter.value, 'i').test(tr.text)) {
							flag = true
							break
						}
					}
					if (!flag)
						return false
				} else
				if (filter.key == "key") {
					if (!new RegExp(filter.value, 'i').test(str.key))
						return false
				} else 
				if (filter.key == "status") {
					if (filter.value == "non_tr") {
						if (str.translations.length > 0)
							return false
					} else
					if (filter.value == "tr") {
						if (str.translations.length == 0)
							return false
					} else 
					if (filter.value == "non_app") {
						if (str.translations?.[0]?.is_approved)
							return false
					} else
					if (filter.value == "app") {
						if (!str.translations?.[0]?.is_approved)
							return false
					}
				}
			}

			return true
		})

		return draws
	}

	async function UpdateTranslation() {
		const str = await fetchString(link["project_id"], link["section_id"], curString.id, true, true)
		strings[curString.index] = {...str, index: curString.index}
		setCurString(strings[curString.index])
		UpdateDrawStrings()
	}

	function ChangePage(page) {
		setCurPage(page)
		setMiddlePage(page)
		setCurString(null)
	}

	async function AddTranslation() {
		setLoading(true)
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations`, "POST", { "text": inputTranslation })
			await UpdateTranslation()
		} catch (err) {
			console.log(err)
		}
		setLoading(false)
	}

	async function DeleteString(str_index) {
		setLoading(true)
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${strings[str_index].id}`, "DELETE")
			strings.splice(str_index, 1)
			for (let i = 0; i < strings.length; i++) {
				strings[i].index = i
			}
			setCurString(null)
			setMaxPage(Math.max(1, Math.ceil(strings.length / page_size)))
			UpdateDrawStrings()
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}
	
	
	async function SaveString() {
		setLoading(true)
		try {
			const str_index = curString.index
			let str = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${strings[str_index].id}`, "PATCH", {
				text: inputText,
				key: inputKey,
				context: inputContext,
				max_tr_length: inputMaxLength,
			})
			strings[curString.index] = {...strings[curString.index], 
				text: str.text, 
				key: str.key,
				context: str.context, 
				max_tr_length: str.max_tr_length
			}
			setCurString(strings[curString.index])
			UpdateDrawStrings()
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}

	async function AddString(str_index) {
		setLoading(true)
		try {
			let str = (await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings?pos=${str_index}`, "POST", {text: " "}))[0]
			strings.splice(str_index, 0, {...str, translations: []})
			for (let i = 0; i < strings.length; i++) {
				strings[i].index = i
			}
			setCurString(strings[str_index])
			setMaxPage(Math.max(1, Math.ceil(strings.length / page_size)))
			UpdateDrawStrings()
			setTimeout(() => {
				setInputText("")
				setEditMode(true)
			}, 100)
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}
	
	async function DeleteTranslation(string_id, translation_id) {
		setLoading(true)
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${string_id}/translations/${translation_id}`, "DELETE")
			await UpdateTranslation()
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}
	
	async function EditTranslation() {
		setLoading(true)
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations/${translationEdit.id}`, "PATCH", { "text": inputTranslation })
			await UpdateTranslation()
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}

	async function ChangeVote(translation_id, is_voted, is_minus) {
		setLoading(true)
		try {
			const tr = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations/${translation_id}/
			${is_voted ? "unvote" : "vote"}	
			`, "POST", { "is_minus": is_minus },)

			await UpdateTranslation(tr)
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}

	async function ChangeApprove(translation_id, approve = true) {
		setLoading(true)
		try {
			const tr = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${link["section_id"]}/strings/${curString.id}/translations/${translation_id}/
			${approve ? "approve" : "unapprove"}	
			`, "POST")

			await UpdateTranslation(tr)
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}

	function AddFilter(key, value) {
		if (value == "" || filters.find((filter) => filter.key == key && filter.value == value))
			return

		const ResolveName = (key, value) => {
			if (key == "orig")
				return "Оригинал содержит: " + value
			else if (key == "trans")
				return "Перевод содержит: " + value
			else if (key == "key")
				return "Ключ содержит: " + value
			else if (key == "status") {
				switch (value) {
					case "non_tr":
						return "Непереведённое"
					case "tr":
						return "Переведённое"
					case "non_app":
						return "Не одобренное"
					case "app":
						return "Одобренное"
				}
			}
		}

		setFilters(filters.concat({
			key: key,
			value: value,
			name: ResolveName(key, value)
		}))

		ChangePage(1)

		console.log(filters)
	}

	function RemoveFilter(key, value) {
		let index = filters.findIndex((filter) => filter.key == key && filter.value == value)
		if (index != -1) {
			setFilters(filters.toSpliced(index, 1))
			ChangePage(1)
		}
	}

	return (
		<>
		<div style={{ height: "100vh" }}>
			{/* <header className="fixed-top" expand="lg"> */}
				<Container fluid className="bg-white py-1 border-bottom d-flex flex-wrap justify-content-between">
					<div className="d-inline-flex align-items-center">
						<LinkWithTooltip tooltip="Вернуться к проекту" id="tooltip-back" where="bottom">
							<Button variant="outline-dark" onClick={routeChange}><BsReplyFill style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
					</div>
					<div className="d-inline-flex align-items-center">
						<h3 className="pt-1">Раздел: {section.name}</h3>
					</div>
					<div className="d-inline-flex align-items-center">
						<LinkWithTooltip tooltip="Настройки редактора" id="tooltip-settings" where="bottom">
							<Button variant="outline-dark" disabled={true}><FaCog style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
					</div>
				</Container>

				<Container fluid
					className="border-bottom bg-white row py-1 d-flex flex-wrap justify-content-between"
					style={{ margin: "0px" }}
				>
					<Col className="py-1 d-inline-flex align-items-center">
						<LinkWithTooltip tooltip="Фильтр" id="tooltip-settings" where="bottom">
							<Dropdown>
								<Dropdown.Toggle as={FilterButton}></Dropdown.Toggle>
								<Dropdown.Menu as={FilterForm}>
									{/* Да пошло оно всё, сделаю костылём*/}
									<Dropdown.Item as={Button} onClick={(e) => {
											AddFilter(
												document.getElementById("select-filter-key").value,
												document.getElementById("select-filter-value").value	
											)
										}}>
										Добавить
									</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Режим перемещения"id="tooltip-settings" where="bottom">
							<Button variant={moveMode ? "primary" : "outline-primary"} style={{ marginLeft: "10px" }}  onClick={(e) => {setMoveMode(!moveMode)}} disabled={true || !userRole?.permissions?.can_manage_strings}><FaArrowsAlt style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						<LinkWithTooltip tooltip="Словарь" id="tooltip-settings" where="bottom">
							<Button variant="outline-primary" style={{ marginLeft: "10px" }} disabled={true}><FaBook style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
					</Col>
					<Col className="py-1 d-inline-flex align-items-center">
						{ maxPage > 1 &&
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
						}
					</Col>
				</Container>
			{/* </header> */}
			<Container>
				{/* <FilterForm/> */}
			</Container>
			<Stack direction="horizontal">
				{filters.map((filter, i) =>
					<>
					<div style={{padding: "10px", border: "1px solid"}}>
						{filter.name}
						<CloseButton onClick={(e) => {RemoveFilter(filter.key, filter.value)}}></CloseButton>
					</div>
					</>
				)}
			</Stack>
			<Container fluid style={{ height: "80%" }}>
				<Row  style={{ height: "100%" }}>
					<Col className="border-bottom" style={{ height: "100%", padding: "0px", overflowY: "auto" }} >
						{drawStrings.slice((curPage - 1) * page_size, curPage * page_size).map((str, i) =>
							<Container id={`str${str.id}`} onClick={ async (e) => SelectString(str.index) } key={str.id} fluid style={{ margin: "0px", padding: "7px", paddingLeft: "0px", minHeight: "100px", backgroundColor: (str.index == curString?.index ? "rgb(240, 240, 240)" : "white") }} className="py-2 d-flex justify-content-between">
								{userRole?.permissions?.can_manage_strings &&
									<Dropdown style={{ alignItems: "center", display: "flex" }}>
										<Dropdown.Toggle variant="outline" data-toggle="dropdown">
										</Dropdown.Toggle>
										<Dropdown.Menu>
											<Dropdown.Item onClick={(e) => {
												setEditMode(true)
												setInputText(str.text)
												setInputKey(str.key)
												setInputContext(str.context)
												setInputMaxLength(str.max_tr_length)
											}}>Редактировать строку</Dropdown.Item>
											<Dropdown.Item onClick={(e) => {
												DeleteString(str.index)
											}}>Удалить строку</Dropdown.Item>
											{filters.length == 0 && 
											<Dropdown.Item onClick={(e) => {
												AddString(str.index + 1)
											}}>Добавить строку</Dropdown.Item>
											}
										</Dropdown.Menu>
									</Dropdown>
								}

								<Col style={{ marginRight: "10px" }}>
									{/* <Form.Check.Label>{str.key}</Form.Check.Label> */}
									<Stack style={{border: "1px solid", height: "100%", position: "relative", whiteSpace: "pre-wrap"}}>
										<div
											readOnly
											className="text-left text-break"
											style={{ paddingTop: "5px", paddingLeft: "10px" }}
										>
											{str.text}
										</div>
										<div style={{position: "relative", bottom: "0", padding: "4px"}}>
											<div style={{color: "rgb(148, 148, 148)", fontStyle: "italic"}}>
												{str.key}
											</div>
											<div>
												<a href={`/projects/${link["project_id"]}/sections/${link["section_id"]}/editor#${str.index}`} onClick={(e) => {PreudoReload(str.index)}}>#{str.index + 1}</a>
												{/* <a href={`${window.location.href}#${str.index}`}>#{str.index + 1}</a> */}
											</div>	
										</div>	
									</Stack>
								</Col>
								<Col>
									<Stack style={{border: "1px solid", height: "100%", whiteSpace: "pre-wrap"}}>
										<div
											readOnly
											className="text-left text-break"
											style={{ paddingTop: "5px", paddingLeft: "10px" }}
										>
											{str.translations?.[0]?.text || ""}
										</div>	
									</Stack>
									{/* <Form.Control className="d-flex align-items-start"
										readOnly
										as="textarea"
										style={{ paddingTop: "5px", paddingLeft: "10px", height: "100%", wordWrap: "break-word" }}
										value=
									>	
									</Form.Control> */}
								</Col>
							<hr style={{ padding: "0px", margin: "0px" }} />
							</Container>
						)}


					</Col>
					<Col className="border-start border-end border-bottom" md={4}>
					{curString 
					? <>
						{!editMode 
						? <>
							{userRole?.permissions?.can_translate &&
							<>
								<Form.Control className="d-flex align-items-start"
									onChange={translationChange}
									as="textarea"
									value={inputTranslation}
									placeholder="Ваш вариант перевода..."
									style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
								>
								</Form.Control>
								<div style={{ color: (inputTranslation.length > curString?.max_tr_length ? "red" : "black") }}>{inputTranslation.length}/{curString?.text.length} {curString?.max_tr_length < 2000 ? `(макс. ${curString?.max_tr_length})` : ""}</div>
								<h6> {curString?.context ? `Контекст: ${curString?.context}` : `` }</h6>

							
								{translationEdit 
									? 	<>
											{!loading 
												? <>
													<Button variant="outline-success" onClick={() => EditTranslation()} disabled={inputTranslation.length > curString?.max_tr_length}><FaPlus /> Сохранить </Button>
													<Button variant="outline-danger" onClick={() => {
														setTranslationEdit(null)
														setInputTranslation("")
													}}><FaPlus /> Отмена </Button>
												</>
												:  <>
												<Button variant="outline-success" disabled><Spinner size="sm"/> Сохранить </Button>
												<Button variant="outline-danger" disabled><Spinner size="sm"/> Отмена </Button>
												</>
											}
										</>
									: 	<>
											{!loading 
												? <Button variant="outline-success" onClick={() => AddTranslation()} disabled={inputTranslation.length > curString?.max_tr_length}><FaPlus /> Добавить перевод </Button>
												: <Button variant="outline-success" disabled><Spinner size="sm"/> Добавить перевод </Button>
											}
										</>
								}
							</>
							}
							<h3>Варианты перевода</h3>
							{curString?.translations?.map((tr, i) =>
							<>
								<Container key={tr.id} style={{ border: (tr.id == translationEdit?.id ? "1px solid orange" : "1px solid")}}>
									<div
										readOnly
										style={{ marginTop: "10px", wordWrap: "break-word", border: "1px solid", whiteSpace: "pre-wrap" }}
									>
										{tr.text}
									</div>
									<div>Автор: {members.find((el) => el.user.id == tr.author_id)?.user?.username || "noname"}</div>
									{ tr.editor_id && 
										<div>Редактор: {members.find((el) => el.user.id == tr.editor_id)?.user?.username || "noname"}</div>
									}
									<div>{new Date(tr.updated_at).toLocaleString()}</div>

									{userRole?.permissions?.can_approve &&
										(!loading
											? <Button variant={tr.is_approved ? "success" : "outline-success"} onClick={(e) => ChangeApprove(tr.id, !tr.is_approved)}><FaCheck/></Button>
											: <Button variant={tr.is_approved ? "success" : "outline-success"} disabled><Spinner size="sm"/></Button>
										)
									}

									{(userRole?.permissions?.can_manage_translations || tr.author_id == user?.id) &&
									(!loading 
										? <>
											<Button variant="outline-primary" onClick={(e) => {
												setInputTranslation(tr.text)
												setTranslationEdit(tr)
											}} ><FaPencilAlt/></Button>

											<Button variant="outline-primary" onClick={(e) => DeleteTranslation(curString.id, tr.id)} ><FaTrashAlt/></Button>
										</>
										: <>
											<Button variant="outline-primary" disabled><Spinner size="sm"/></Button>
											<Button variant="outline-primary" disabled><Spinner size="sm"/></Button>
										</>
									)
									}
									
									<div>
										<DropdownButton as={ButtonGroup} variant="" title={ tr.votes_plus.length }>
										{tr.votes_plus.map((vote) => 
											<Dropdown.Item href={"/users/" + vote.id}>
											{vote.username}
											</Dropdown.Item>
										)}
										</DropdownButton>

										<Button disabled={!userRole?.permissions?.can_translate || tr.author_id == user?.id} variant={tr.votes_plus.find((el) => el.id == user?.id) ? "success" : "outline-success"} onClick={(e) => ChangeVote(tr.id, !!tr.votes_plus.find((el) => el.id == user?.id), false)}><FaArrowUp style={{ marginBottom: "3px" }}/></Button>

										<Button disabled={!userRole?.permissions?.can_translate || tr.author_id == user?.id} variant={tr.votes_minus.find((el) => el.id == user?.id) ? "danger" : "outline-danger"} onClick={(e) => ChangeVote(tr.id, !!tr.votes_minus.find((el) => el.id == user?.id), true)}><FaArrowDown style={{ marginBottom: "3px" }}/></Button>

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
						</>
						: <>
							<h6>Текст:</h6>
							<Form.Control className="d-flex align-items-start"
								onChange={textChange}
								as="textarea"
								value={inputText}
								placeholder="Текст строки"
								style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
							>
							</Form.Control>
							{section?.type == "json" &&  <>
								<h6>Ключ:</h6>
								<Form.Control className="d-flex align-items-start"
									onChange={keyChange}
									as="textarea"
									value={inputKey}
									placeholder="Ключ строки"
									style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
								>
								</Form.Control>
							</>}
							<h6>Контекст:</h6>
							<Form.Control className="d-flex align-items-start"
								onChange={contextChange}
								as="textarea"
								value={inputContext}
								placeholder="Контекст строки"
								style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
							>
							</Form.Control>

							<h6>Макс. число символов:</h6>
							<Form.Control type="number" onChange={maxLengthChange} min="1" max="2000" value={inputMaxLength} />
							{/* <input type="number" id="tentacles" name="tentacles" min="10" max="100" /> */}

						
							{!loading 
								? <>
									<Button variant="outline-success" onClick={() => SaveString()}><FaPlus /> Сохранить </Button>
									<Button variant="outline-danger" onClick={() => {
										setEditMode(false)
									}}><FaPlus /> Отмена </Button>
								</>
								:  <>
								<Button variant="outline-success" disabled><Spinner size="sm"/> Сохранить </Button>
								<Button variant="outline-danger" disabled><Spinner size="sm"/> Отмена </Button>
								</>
							}
						</>
						}
					</>
					: <>
					</>
					}
					</Col>
				</Row>
			</Container>
		</div>
		</>
	);
}



const FilterButton = React.forwardRef(({ children, onClick }, ref) => (
	<Button ref={ref} variant="outline-primary" style={{ marginLeft: "10px" }} onClick={(e) => {
		e.preventDefault();
		onClick(e);
	}}><FaFilter style={{ marginBottom: "3px" }} /></Button>
));

const FilterForm = React.forwardRef(
	({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
	const [key, setKey] = useState("orig")
	const [value, setValue] = useState("")

	return <>
	<div id="filter" ref={ref} className={className} style={{backgroundColor: "white", position: "absolute", padding: "15px 15px 15px", width: "250px"}}
	onClose={(e) => {
		console.log("hmm")
	}}>
		<Form.Select defaultValue="orig" id="select-filter-key" onChange={(e) => {setKey(e.target.value)}} >
			<option value="orig">Оригинал содержит</option>
			<option value="trans">Перевод содержит</option>
			<option value="key">Ключ содержит</option>
			<option value="status">Статус</option>
		</Form.Select>
		{(key == "orig" || key == "trans" || key == "key") &&
			<Form.Control id="select-filter-value" onChange={(e) => {setValue(e.target.value)}}></Form.Control>
		}
		{key == "status" &&
			<Form.Select defaultValue="non_tr" id="select-filter-value" onChange={(e) => {setValue(e.target.value)}}>
				<option value="non_tr">Непереведенное</option>
				<option value="tr">Переведенное</option>
				<option value="non_app">Не одобрено</option>
				<option value="app">Одобрено</option>
			</Form.Select>
		}
		{children}
	</div>
	</>
})