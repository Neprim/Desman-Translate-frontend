import '../misc.css';
import Button from "react-bootstrap/Button"
import Container from 'react-bootstrap/Container'
import Form from "react-bootstrap/Form"
import InputGroup from "react-bootstrap/InputGroup";
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import placeholder from "../images/placeholder.png";
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import { useNavigate } from "react-router-dom"
import { FaRegCommentAlt, FaCommentAlt, FaCog, FaFilter, FaSortAmountDownAlt, FaBookOpen, FaEyeSlash, FaPlus, FaCheck, FaCode, FaRegTrashAlt, FaArrowUp, FaArrowDown, FaUndo, FaRedo, FaBook, FaPencilAlt, FaTrash, FaTrashAlt, FaArrowsAlt, FaPen, FaMinus, FaCopy, FaRegCopy } from "react-icons/fa"
import { CiWarning } from "react-icons/ci"
import { BsReplyFill, BsChatLeftText, BsGlobe } from "react-icons/bs"
import { Link, useParams } from "react-router-dom";
import Pagination from 'react-bootstrap/Pagination';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Stack from 'react-bootstrap/Stack';
import CloseButton from 'react-bootstrap/CloseButton';
import Spinner from 'react-bootstrap/Spinner';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Tab from "react-bootstrap/Tab"
import Tabs from "react-bootstrap/Tabs"
import { getLoc } from "../Translation"


import React, { setState, useEffect, useState, formData, useContext, useRef } from "react"
import { AuthContext } from "../AuthContext";
import { FormGroup, FormLabel, OverlayTrigger, Tooltip } from "react-bootstrap"
import { fetchSomeAPI, fetchProject, fetchStrings, fetchString, fetchSection, fetchSections, fetchUser } from "../APIController"

function LinkWithTooltip({ id, children, href, tooltip, where }) {
	return (<>
		<OverlayTrigger
			overlay={<Tooltip id={id}>{tooltip}</Tooltip>}
			placement={where}
			delayShow={300}
			delayHide={150}
		>
		<div>{children}</div>
		</OverlayTrigger>
	</>);
}



let strings = []
let rearrange_strings = []
let dictionary = []

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
	const [sortBy, setSortBy] = useState("")
	
	const translationChange = e => setInputTranslation(e.target.value)
	const textChange 		= e => setInputText(e.target.value);
	const keyChange 		= e => setInputKey(e.target.value);
	const contextChange 	= e => setInputContext(e.target.value);
	const maxLengthChange 	= e => setInputMaxLength(e.target.value);

	const [project, setProject] = useState({});
	const [sections, setSections] = useState([]);
	const [members, setMembers] = useState([]);
	const [translators, setTranslators] = useState([])
	const [roles, setRoles] = useState([]);
	const [userRole, setUserRole] = useState(null);
	
	const [loading, setLoading] = useState(false)
	const [loadingStrings, setLoadingStrings] = useState(false)
	const [editMode, setEditMode] = useState(false)
	
	const [moveMode, setMoveMode] = useState(false)
	const [draggedElem, setDraggedElem] = useState(-1)

	const [translateWarning, setTranslateWarning] = useState("")
	
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
			console.log(project)
            setMembers(project.members)
            setRoles(project.roles)

			let secs = []

			if (link["sections_list"] == 'all') {
				secs = (await fetchSections(link["project_id"]))
			} else {
				let sec_ids = link["sections_list"].split("_").map((x) => parseInt(x, 16))
				secs = []
				for (const id of sec_ids) {
					secs.push(await fetchSection(link["project_id"], id))
				}
				console.log(secs)
			}

			setSections(secs)
			
			// setSections(await fetchSection(link["project_id"], link["section_id"]))
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

	async function GetDictionary() {
        try {
            let dict = await fetchSomeAPI(`/api/projects/${link["project_id"]}/dictionary`)
            console.log(dict)
            dictionary = dict

			for (let dict of dictionary) {
				dict.word_key = new RegExp(dict.word_key, 'gi')
				dict.translate_key = new RegExp(dict.translate_key, 'gi')
			}

			if (strings.length) {
				FindWordsInStrings()
			}
        } catch (err) {
            console.log(err)
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
        GetProject()
		GetDictionary()
    }, [])

	useEffect(() => {
        GetUserRole();
    }, [project, user])

	async function GetStrings() {
		setLoading(true)
		setLoadingStrings(true)
		try {
			let sec_ids = []

			if (link["sections_list"] == 'all') {
				sec_ids = (await fetchSections(link["project_id"])).map((x) => x.id)
			} else {
				sec_ids = link["sections_list"].split("_").map((x) => parseInt(x, 16))
			}
			let trs = {}
			if (user)
				trs[user.id] = 1

			let strs = []
			for (let i = 0; i < sec_ids.length; i++) {
				const id = sec_ids[i]
				let coms = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${id}/comments`)
				let strs_coms = {}
				let id_coms = {}
				for (let com of coms) {
					id_coms[com.id] = com
					trs[com.author_id] = 1
					if (com.reply != -1) {
						if (!id_coms[com.reply].replies)
							id_coms[com.reply].replies = []
						id_coms[com.reply].replies.push(com)
					} else {
						if (!strs_coms[com.string_id])
							strs_coms[com.string_id] = []
						strs_coms[com.string_id].push(com)
					}
				}

				let strs_t = await fetchStrings(link["project_id"], id, true, true)
				for (let str of strs_t) {
					str.sec_ind = i
					str.comments = strs_coms[str.id] || []
					strs.push(str)
					for (let tr of str.translations) {
						trs[tr.author_id] = 1
						if (tr.editor_id)
							trs[tr.editor_id] = 1
					}
				}
			}
			let sel = -1

			for (let i = 0; i < strs.length; i++) {
				strs[i].index = i
				if (window.location.hash.substring(1) && strs[i].index == window.location.hash.substring(1) - 1) {
					sel = i
					ChangePage(1 + Math.floor(i / page_size), false)
				}
			}
			console.log(strs)

			setMaxPage(Math.max(1, Math.ceil(strs.length / page_size)))

			strings = strs
			console.log(strings)

			if (dictionary.length) {
				FindWordsInStrings()
			}
			
			setLoadingStrings(false)
			UpdateDrawStrings()

			if (sel != -1) {
				ScrollTo('str' + strings[sel].id, sel)
			} else {
				SelectString(0)
			}

			let trs_e = []
			for (let tr in trs) {
				trs_e.push(await fetchUser(tr))
			}
			setTranslators(trs_e)
		} catch (err) {
			console.log(err)
		}
		setLoading(false)
	}

	function ScrollTo(id, sel) {
		setTimeout(() => {
			let str = document.getElementById(id)
			if (!str)
				ScrollTo(id, sel)
			else {
				str.scrollIntoView({ behavior: "smooth" })
				SelectString(sel)
			}
		}, 100)
	}

	function PseudoReload(sel) {
		setFilters([])
		setSortBy("")
		setStatusChecked(false)
		setKeyChecked(false)
		setOrigChecked(false)
		setTransChecked(false)
		setOnlyCurrentChecked(false)
		setUserChecked(false)

		const strs = strings
		setDrawStrings(strs)

		ChangePage(1 + Math.floor(strings.findIndex((str) => str.index == sel) / page_size), false)

		// UpdateDrawStrings()

		console.log("PseudoReload")
		console.log(curPage)
		console.log(sel)

		if (sel != -1) {
			ScrollTo('str' + strings[sel].id, sel)
		}
	}

	function SelectString(str_index) {
		setCurString(strings[str_index])
	}

	useEffect(() => {
		GetStrings()
	}, [])

	const textareaTranslate = useRef(null);
	useEffect(() => {
		setTranslationEdit(null)
		setInputTranslation(curString?.text || "")
		if (editMode) {
			setInputText(curString.text)
			setInputKey(curString.key)
			setInputContext(curString.context)
			setInputMaxLength(curString.max_tr_length)
		}
		setTimeout(() => {
		const t = textareaTranslate.current
		if (t != null) {
			t.style.height = "auto"
			t.style.overflowY = 'hidden'
			t.style.height = t.scrollHeight + "px"
		}}, 10)
	}, [curString])

	useEffect(() => {
		let strs = SortStrings(FilterStrings(strings))
		setDrawStrings(strs)
		setMaxPage(Math.max(1, Math.ceil(strs.length / page_size)))
		setCurString(strs[0] || null)
	}, [filters, sortBy])

	function FindWordsInString(str) {
		let draw_text = []
		let words = []
		let dicts = []
		for (let i = 0; i < dictionary.length; i++) {
			const d = dictionary[i]
			for (let f of str.text.matchAll(new RegExp(d.word_key, 'gi'))) {
				words.push({dict: i, ind: f.index, word: f[0]})
			}
		}
		words = words.sort((a, b) => a.ind - b.ind)
		let cur = 0
		for (let i = 0; i < words.length; i++) {
			if (words[i].ind < cur)
				continue
			draw_text.push({text: str.text.substring(cur, words[i].ind)})
			draw_text.push({text: words[i].word, desc: dictionary[words[i].dict].desc})
			dicts.push(i)

			cur = words[i].ind + words[i].word.length
		}
		draw_text.push({text: str.text.substring(cur)})

		draw_text = draw_text.map((word) => {
			if (word.desc) {
				return <abbr title={word.desc}>{word.text}</abbr>
			}
			return word.text
		})

		str.draw_text = draw_text
		str.dicts = dicts
		return str
	}

	function FindWordsInStrings() {
		for (let i = 0; i < strings.length; i++) {
			strings[i] = FindWordsInString(strings[i])
		}

		UpdateDrawStrings()
	}

	useEffect(() => {
		if (editMode)
			return
		if (!curString || !curString.dicts)
			return 
		
		let warn = ""
		for (let i of curString.dicts) {
			if (!inputTranslation.match(dictionary[i]?.translate_key)) {
				warn += `${getLoc("editor_missing_translation_warning")} "${dictionary[i].translate}"\n`
			}
		}
		setTranslateWarning(warn)
	}, [inputTranslation])

	function UpdateDrawStrings() {
		setDrawStrings(SortStrings(FilterStrings(strings)))
	}

	function FilterStrings(strs) {
		let draws = strs.filter((str) => {
			delete str.draw_key
			delete str.draw_text_f
			for (let tr of str.translations)
				delete tr.draw_text
			for (let filter of filters) {
				let value = filter.value
				if (!filter.is_regex) {
					value = filter.value.replace(/[\\\/\-\^\$\*\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
				}
				let flag = false
				switch (filter.key) {
					case "orig":
						if (!new RegExp(value, 'i').test(str.text))
							return false
						break


					case "trans":
						flag = false
						for (let tr of str.translations) {
							if (new RegExp(value, 'i').test(tr.text)) {
								flag = true
								break
							}
							if (onlyCurrentChecked)
								break
						}
						if (!flag)
							return false
						break


					case "key":
						if (!new RegExp(value, 'i').test(str.key))
							return false
						break


					case "status":
						switch (value) {
							case "non_tr":
								if (str.translations.length > 0)
									return false
								break
							
							case "tr":
								if (str.translations.length == 0)
									return false
								break
							
							case "non_app":
								if (str.translations?.[0]?.is_approved)
									return false
								break

							case "app":
								if (!str.translations?.[0]?.is_approved)
									return false
								break
						}
						break

					case "user":
						flag = false
						for (let tr of str.translations) {
							if (tr.author_id == value || tr.editor_id == value) {
								flag = true
								break
							}
						}
						if (!flag)
							return false
						break
				}
			}

			return true
		})

		function BreakIntoWords(text, reg) {
			let words = []
			for (let f of text.matchAll(new RegExp(reg, 'gi'))) {
				words.push({ind: f.index, word: f[0]})
			}
			let cur = 0
			let arr = []
			for (let i = 0; i < words.length; i++) {
				if (words[i].ind < cur)
					continue
				arr.push({text: text.substring(cur, words[i].ind)})
				arr.push({text: words[i].word, f: true})

				cur = words[i].ind + words[i].word.length
			}
			arr.push({text: text.substring(cur)})

			return arr
		}
		
		if (filters.find((f) => f.key == "key" || f.key == "orig" || f.key == "trans")) {
			for (let filter of filters) {
				let value = filter.value
				if (!filter.is_regex) {
					value = filter.value.replace(/[\\\/-\^\$\*\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
				}
				if (filter.key == "key") {
					for (let str of draws) {
						let draw_key = BreakIntoWords(str.key, value)

						draw_key = draw_key.map((word) => {
							if (word.f) {
								return <span style={{ backgroundColor: "rgb(255, 255, 0)"}}>{word.text}</span>
							}
							return word.text
						})

						str.draw_key = draw_key
					}
				}

				if (filter.key == "orig") {
					for (let str of draws) {
						let draw_text_f = BreakIntoWords(str.text, value)
						console.log(draw_text_f)

						draw_text_f = draw_text_f.map((word) => {
							if (word.f) {
								return <span style={{ backgroundColor: "rgb(255, 255, 0)"}}>{word.text}</span>
							}
							return word.text
						})

						str.draw_text_f = draw_text_f
					}
				}

				if (filter.key == "trans") {
					for (let str of draws) {
						for (let tr of str.translations) {
							let draw_text = BreakIntoWords(tr.text, value)

							draw_text = draw_text.map((word) => {
								if (word.f) {
									return <span style={{ backgroundColor: "rgb(255, 255, 0)"}}>{word.text}</span>
								}
								return word.text
							})

							tr.draw_text = draw_text
							if (onlyCurrentChecked)
								break
						}
					}
				}
			}
		}

		return draws
	}

	function SortStrings(strs) {
		if (sortBy == "last_str_time")
		return strs.sort((a, b) => {
			return b.updated_at - a.updated_at
		})
		
		if (sortBy == "last_tr_time")
		return strs.sort((a, b) => {
			return 	  b.translations.reduce((tm, tr) => Math.max(tm, tr.updated_at), 0)
					- a.translations.reduce((tm, tr) => Math.max(tm, tr.updated_at), 0)
		})
		
		if (sortBy == "tr_amount")
		return strs.sort((a, b) => {
			return 	  b.translations.length
					- a.translations.length
		})
		
		if (sortBy == "vote_plus_amount")
		return strs.sort((a, b) => {
			return 	  ((b.translations?.[0]?.votes_plus?.length || 0) - (b.translations?.[0]?.votes_minus?.length || 0))
					- ((a.translations?.[0]?.votes_plus?.length || 0) - (a.translations?.[0]?.votes_minus?.length || 0))
		})
		
		if (sortBy == "vote_minus_amount")
		return strs.sort((a, b) => {
			return 	  ((a.translations?.[0]?.votes_plus?.length || 0) - (a.translations?.[0]?.votes_minus?.length || 0))
					- ((b.translations?.[0]?.votes_plus?.length || 0) - (b.translations?.[0]?.votes_minus?.length || 0))
		})
		
		if (sortBy == "comments_amount")
		return strs.sort((a, b) => {
			return 	  GetCommentsAmount(b?.comments || [])
					- GetCommentsAmount(a?.comments || [])
		})

		return strs
	}

	async function UpdateTranslation() {
		const sec = sections[curString.sec_ind]
		const str = await fetchString(link["project_id"], sec.id, curString.id, true, true)
		strings[curString.index] = {...curString, ...str}
		setCurString(strings[curString.index])
		UpdateDrawStrings()
	}

	function ChangePage(page, change_str = true) {
		setCurPage(page)
		setMiddlePage(page)
		if (change_str) {
			// setCurString(drawStrings[(page - 1) * page_size])
			if (drawStrings[(page - 1) * page_size]?.id)
				ScrollTo('str' + drawStrings[(page - 1) * page_size].id, (page - 1) * page_size)
		}
	}

	async function AddTranslation() {
		setLoading(true)
		try {
			const sec = sections[curString.sec_ind]
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings/${curString.id}/translations`, "POST", { "text": inputTranslation })
			await UpdateTranslation()
		} catch (err) {
			console.log(err)
		}
		setLoading(false)
	}

	async function DeleteString(str_index) {
		setLoading(true)
		try {
			const sec = sections[curString.sec_ind]
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings/${strings[str_index].id}`, "DELETE")
			strings.splice(str_index, 1)
			for (let i = 0; i < strings.length; i++) {
				strings[i].index = i
			}
			setCurString(strings[Math.min(str_index, strings.length - 1)])
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
			const sec = sections[curString.sec_ind]
			let str = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings/${strings[str_index].id}`, "PATCH", {
				text: inputText,
				key: inputKey,
				context: inputContext,
				max_tr_length: inputMaxLength,
			})
			strings[str_index] = FindWordsInString({...strings[str_index], 
				text: str.text, 
				key: str.key,
				context: str.context, 
				max_tr_length: str.max_tr_length
			})
			
			setCurString(strings[str_index])
			UpdateDrawStrings()
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}

	async function AddString(str_index) {
		setLoading(true)
		try {
			// Костыль, по-хорошему указывать главу, в которую добавляем строку.
			// Но это добавлю как-нибудь потом. Пока что это будет возможно только при одной главе в редакторе.
			const sec = sections[0]
			let str = (await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings?pos=${str_index}`, "POST", {text: " "}))[0]
			str.sec_ind = 0
			strings.splice(str_index, 0, {...str, translations: []})
			for (let i = 0; i < strings.length; i++) {
				strings[i].index = i
			}
			setInputMaxLength(str.max_tr_length)
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
			const sec = sections[curString.sec_ind]
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings/${string_id}/translations/${translation_id}`, "DELETE")
			await UpdateTranslation()
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}
	
	async function EditTranslation() {
		setLoading(true)
		try {
			const sec = sections[curString.sec_ind]
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings/${curString.id}/translations/${translationEdit.id}`, "PATCH", { "text": inputTranslation })
			await UpdateTranslation()
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}

	async function ChangeVote(translation_id, is_voted, is_minus) {
		setLoading(true)
		try {
			const sec = sections[curString.sec_ind]
			const tr = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings/${curString.id}/translations/${translation_id}/
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
			const sec = sections[curString.sec_ind]
			const tr = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings/${curString.id}/translations/${translation_id}/
			${approve ? "approve" : "unapprove"}	
			`, "POST")

			await UpdateTranslation(tr)
		} catch (err) {
			console.log(err)
		} 
		setLoading(false)
	}

	function UpdateFilters(fls) {
		setFilters(fls)

		setCurString(drawStrings[0])

		ChangePage(1)
	}

	function MoveElemTo(pos) {
        pos = Number(pos)
        if (draggedElem != -1) {
            const elem = rearrange_strings[draggedElem]
            if (pos >= draggedElem) {
                setDrawStrings(rearrange_strings.toSpliced(pos + 1, 0, elem).toSpliced(draggedElem, 1))
            } else if (pos < draggedElem) {
                setDrawStrings(rearrange_strings.toSpliced(draggedElem, 1).toSpliced(pos, 0, elem))
            }
        }
    }

	async function SaveRearrange() {
		setLoading(true)
		try {
			let ids = []
			for (const str of rearrange_strings) {
				ids.push(str.id)
			}
			// Аналогично добавлению, будет доступно только при редактировании одного раздела.
			const sec = sections[0]
			ids = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sec.id}/strings`, "PATCH", {
				strings: ids
			})
			let rev_str = {}
			for (const str of strings) {
				rev_str[str.id] = str
			}
			let strs = []
			for (let i = 0; i < ids.length; i++) {
				const id = ids[i]
				strs.push(rev_str[id])
				strs[i].index = i
			}

			strings = strs
		} catch (err) {
			console.log(err)
		}
		setMoveMode(false)
		UpdateDrawStrings()
		setLoading(false)
	}

	function OpenComments(str) {
		strings[str.index].show_comments = true
		str.show_comments = true
		UpdateDrawStrings()
	}

	function CloseComments(str) {
		strings[str.index].show_comments = false
		str.show_comments = false
		UpdateDrawStrings()
	}

	async function PostComment(text, str, reply = -1) {
		setLoading(true)
		try {
			let com = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sections[str.sec_ind].id}/strings/${str.id}/comments`, "POST", { text: text, reply: reply?.id || -1, })
			if (reply != -1) {
				if (!reply.replies)
					reply.replies = []
				reply.replies.push(com)
			} else {
				strings[str.index].comments.push(com)
			}
			UpdateDrawStrings()
		} catch (err) {
			console.log(err)
		}
		setLoading(false)
	}

	async function EditComment(text, str, comment) {
		setLoading(true)
		try {
			let com = await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sections[str.sec_ind].id}/strings/${str.id}/comments/${comment.id}`, "PATCH", { text: text, })
			comment.text = com.text
			comment.updated_at = com.updated_at
			UpdateDrawStrings()
		} catch (err) {
			console.log(err)
		}
		setLoading(false)
	}

	async function DeleteComment(comment, str) {
		setLoading(true)
		try {
			await fetchSomeAPI(`/api/projects/${link["project_id"]}/sections/${sections[str.sec_ind].id}/strings/${str.id}/comments/${comment.id}`, "DELETE")
			comment.text = ""
			UpdateDrawStrings()
		} catch (err) {
			console.log(err)
		}
		setLoading(false)
	}

	function DrawComment(com, str, depth = 0) {
		const author = translators.find(tr => tr.id == com.author_id)
		return <>
		<Container id={`comment-${com.id}`} style={{ marginLeft: depth * 8 + "px" }} className={(depth ? 'border-start' : "")}>
			<Container style={{ marginLeft: "6px", padding: "8px", position: "relative" }}>
				{com.text != ""
				?	<><div className="text-break">{com.text}</div>
					<div style={{ color: "rgb(148, 148, 148)", fontSize: "smaller" }}>
						<img src={author?.avatar_url || placeholder} width="20px" height="20px"></img>
						<Link to={"/users/" + author?.id} style={{ color: "inherit", marginLeft: "4px", marginRight: "4px" }}>{author?.username}</Link>

						<span>{new Date(com?.updated_at).toLocaleString()}</span>

						<a href="#" style={{ color: "inherit", marginLeft: "4px", marginRight: "12px" }} onClick={(e) => {
							if (com.author_id == user?.id)
								document.getElementById(`comment-${com.id}-edit`).hidden = true
							document.getElementById(`comment-${com.id}-reply`).hidden = false
						}}>{getLoc("editor_comments_reply")}</a>

						{com.author_id == user?.id &&
							<a href="#" style={{ color: "inherit", marginLeft: "4px", marginRight: "12px" }} onClick={(e) => {
								document.getElementById(`comment-${com.id}-edit`).hidden = false
								document.getElementById(`comment-${com.id}-reply`).hidden = true
							}}>{getLoc("editor_comments_edit")}</a>
						}

						{(com.author_id == user?.id || userRole?.permissions?.can_manage_strings) &&
							<FaTrash onClick={(e) => {
								if (window.confirm(getLoc("editor_are_you_sure"))) {
									if (com.author_id == user?.id)
										document.getElementById(`comment-${com.id}-edit`).hidden = false
									document.getElementById(`comment-${com.id}-reply`).hidden = false
									DeleteComment(com, str)
								}
							}}/>
						}
					</div>
					{com.author_id == user?.id &&
						<div id={`comment-${com.id}-edit`} style={{ marginLeft: "8px", marginTop: "8px", marginBottom: "8px" }} hidden>
							<Form.Control className="d-flex align-items-start"
								as="textarea"
								placeholder={getLoc("editor_comments_placeholder")}
								defaultValue={com.text}
								maxLength={400}
								style={{ wordWrap: "break-word", marginBottom: "4px" }}
								id={`comment-input-edit-${com.id}`}
							>
							</Form.Control>
							<Button variant="outline-warning" className="comment-button" onClick={() => {
								const input = document.getElementById(`comment-input-edit-${com.id}`)
								if (input.value != "") {
									EditComment(input.value, str, com)
									document.getElementById(`comment-${com.id}-edit`).hidden = true
								}
							}}>{getLoc("editor_comments_save")} </Button>
							<Button variant="outline-danger" className="comment-button" onClick={() => {
								document.getElementById(`comment-${com.id}-edit`).hidden = true
							}}>{getLoc("editor_comments_cancel")} </Button>
						</div>
					}
					<div id={`comment-${com.id}-reply`} style={{ marginLeft: "8px", marginTop: "8px", marginBottom: "8px" }} hidden>
						<Form.Control className="d-flex align-items-start"
							as="textarea"
							maxLength={400}
							placeholder={getLoc("editor_comments_placeholder")}
							style={{ wordWrap: "break-word", marginBottom: "4px" }}
							id={`comment-input-comment-${com.id}`}
						>
						</Form.Control>
						<Button variant="outline-success" className="comment-button" onClick={() => {
							const input = document.getElementById(`comment-input-comment-${com.id}`)
							if (input.value != "") {
								PostComment(input.value, str, com)
								document.getElementById(`comment-${com.id}-reply`).hidden = true
							}
						}}>{getLoc("editor_comments_add")} </Button>
						<Button variant="outline-danger" className="comment-button" onClick={() => {
							document.getElementById(`comment-${com.id}-reply`).hidden = true
						}}>{getLoc("editor_comments_cancel")} </Button>
					</div>
					</>
				: 	<><div>
						<i style={{ color: "rgb(148, 148, 148)" }}>{getLoc("editor_comments_deleted_comment")}</i>
					</div></>
				}
				{com?.replies?.length &&
					<div style={{ position: "absolute", left: "-24px", bottom: "0px", margin: "10px" }}>
						<a onClick={(e) => {
							let thread = document.getElementById(`comment-child-${com.id}`)
							thread.hidden = !thread.hidden
							e.currentTarget.children[0].hidden = thread.hidden
							e.currentTarget.children[1].hidden = !thread.hidden
						}}>
							<div><FaMinus></FaMinus></div>
							<div hidden><FaPlus></FaPlus></div>
						</a>
					</div>
				}
			</Container>
			<Container id={`comment-child-${com.id}`}>
				{com?.replies?.map(com => DrawComment(com, str, depth + 1))}
			</Container>
		</Container>
		</>
	}

	function GetCommentsAmount(coms) {
		let am = coms?.length
		for (let com of coms) {
			am += GetCommentsAmount(com?.replies || [])
		}
		return am
	}

	

	const [statusValue, setStatusValue] = useState("non_tr")
	const [keyValue, setKeyValue] = useState("")
	const [origValue, setOrigValue] = useState("")
	const [transValue, setTransValue] = useState("")
	const [userValue, setUserValue] = useState("")

	const [statusChecked, setStatusChecked] = useState(false)
	const [keyChecked, setKeyChecked] = useState(false)
	const [origChecked, setOrigChecked] = useState(false)
	const [transChecked, setTransChecked] = useState(false)
	const [onlyCurrentChecked, setOnlyCurrentChecked] = useState(false)
	const [userChecked, setUserChecked] = useState(false)

	function ChangeValueAndSetChecked(value, func_v, func_c) {
		func_v(value)
		if (value) {
			func_c(true)
		} else {
			func_c(false)
		}
	}

	return (
		<>
		<title>{project?.name || getLoc("project_project")} - {getLoc("editor_title")}</title>
		<div style={{ height: "100vh" }}>
			{/* <header className="fixed-top" expand="lg"> */}
				<Container fluid className="bg-white py-1 border-bottom d-flex flex-wrap justify-content-between">
					<div className="d-inline-flex align-items-center">
						<LinkWithTooltip tooltip={getLoc("editor_back_to_project")} id="tooltip-back" where="bottom">
							<Button variant="outline-dark" onClick={routeChange}><BsReplyFill style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
					</div>
					<div className="d-inline-flex align-items-center">
						<h3 className="pt-1">
							{sections.length == 1 
								? `${getLoc("editor_current_chapter")}: ${sections[0].name}` 
								: link["sections_list"] == 'all'
									? `${getLoc("editor_all_chapters")}`
								 	: `${getLoc("editor_current_chapters")}: ` + sections.map((sec) => sec.name).join("; ")
							}
						</h3>
					</div>
					<div className="d-inline-flex align-items-center">
						<LinkWithTooltip tooltip={getLoc("editor_settings")} id="tooltip-settings" where="bottom">
							<Button variant="outline-dark" disabled={true}><FaCog style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
					</div>
				</Container>

				<Container fluid
					className="border-bottom bg-white row py-1 d-flex flex-wrap justify-content-between"
					style={{ margin: "0px" }}
				>
					<Col className="py-1 d-inline-flex align-items-center">
						<Dropdown>
							<LinkWithTooltip tooltip={getLoc("editor_filter")} id="tooltip-settings" where="bottom"><div></div>
								<Dropdown.Toggle variant={filters.length ? "primary" : "outline-primary"} style={{ marginLeft: "10px" }} bsPrefix="no-damn-caret">
									<FaFilter style={{ marginBottom: "3px" }} />
								</Dropdown.Toggle>
							</LinkWithTooltip>
							<Form className="form-inline">
							<Dropdown.Menu style={{ padding: "15px 15px 15px", minWidth: "300px"}}>
								<InputGroup style={{ marginBottom: "5px" }}>
									<InputGroup.Checkbox id='filter-status-checkbox' checked={statusChecked} onChange={(e) => {setStatusChecked(e.target.checked)}}/>
									<Form.Select id='filter-status-value' value={statusValue} onChange={(e) => {ChangeValueAndSetChecked(e.target.value, setStatusValue, setStatusChecked)}}>
										<option value="non_tr">{getLoc("editor_filter_not_translated")}</option>
										<option value="tr">{getLoc("editor_filter_translated")}</option>
										<option value="non_app">{getLoc("editor_filter_not_approved")}</option>
										<option value="app">{getLoc("editor_filter_approved")}</option>
									</Form.Select>
								</InputGroup>
								<InputGroup style={{ marginBottom: "5px" }}>
									<InputGroup.Checkbox id='filter-user-checkbox' checked={userChecked} onChange={(e) => {setUserChecked(e.target.checked)}}/>
									<Form.Select id='filter-user-value' value={userValue} onChange={(e) => {ChangeValueAndSetChecked(e.target.value, setUserValue, setUserChecked)}}>
										<option value="">-- {getLoc("editor_filter_from_translator")} --</option>
										{translators?.map((tr) =>
											<option value={tr.id}>{tr.username}</option>
										)}
									</Form.Select>
								</InputGroup>
								<InputGroup style={{ marginBottom: "5px" }}>
									<InputGroup.Checkbox id='filter-key-checkbox' checked={keyChecked} onChange={(e) => {setKeyChecked(e.target.checked)}}/>
									<Form.Control id='filter-key-value' value={keyValue} onChange={(e) => {ChangeValueAndSetChecked(e.target.value, setKeyValue, setKeyChecked)}} placeholder={getLoc("editor_filter_key_contains")} />
								</InputGroup>
								<InputGroup style={{ marginBottom: "5px" }}>
									<InputGroup.Checkbox id='filter-orig-checkbox' checked={origChecked} onChange={(e) => {setOrigChecked(e.target.checked)}}/>
									<Form.Control id='filter-orig-value' value={origValue} onChange={(e) => {ChangeValueAndSetChecked(e.target.value, setOrigValue, setOrigChecked)}} placeholder={getLoc("editor_filter_orig_contains")} />
								</InputGroup>
								<InputGroup style={{ marginBottom: "5px" }}>
									<InputGroup.Checkbox id='filter-tr-checkbox' checked={transChecked} onChange={(e) => {setTransChecked(e.target.checked)}}/>
									<Form.Control id='filter-tr-value' value={transValue} onChange={(e) => {ChangeValueAndSetChecked(e.target.value, setTransValue, setTransChecked)}} placeholder={getLoc("editor_filter_tr_contains")} />
								</InputGroup>
								<InputGroup style={{ marginBottom: "5px" }} hidden={!transChecked}>
									<InputGroup.Checkbox id='filter-tr-checkbox' checked={onlyCurrentChecked} onChange={(e) => {setOnlyCurrentChecked(e.target.checked)}}/>
									<Form.Text style={{ margin: "5px" }}>{getLoc("editor_filter_only_current_tr")}</Form.Text>
								</InputGroup>
								<ButtonToolbar className="justify-content-around">
									<Button type="submit" variant='primary' onClick={(e) => {
										e.preventDefault()
										let fls = []
										if (statusChecked)
											fls.push({key: "status", value: statusValue})
										if (keyChecked && keyValue)
											fls.push({key: "key", value: keyValue})
										if (origChecked && origValue)
											fls.push({key: "orig", value: origValue})
										if (transChecked && transValue)
											fls.push({key: "trans", value: transValue})
										if (userChecked && userValue)
											fls.push({key: "user", value: userValue})

										UpdateFilters(fls)
									}}>{getLoc("editor_filter_apply")}</Button>
									<Button variant='secondary' onClick={(e) => {
										e.preventDefault()
										setStatusValue("non_tr")
										setKeyValue("")
										setOrigValue("")
										setTransValue("")
										setUserValue("")
										setStatusChecked(false)
										setKeyChecked(false)
										setOrigChecked(false)
										setTransChecked(false)
										setOnlyCurrentChecked(false)
										setUserChecked(false)

										UpdateFilters([])
									}}>{getLoc("editor_filter_reset")}</Button>
								</ButtonToolbar>
							</Dropdown.Menu>
							</Form>
						</Dropdown>

						<Dropdown>
							<LinkWithTooltip tooltip={getLoc("editor_sort")} id="tooltip-settings" where="bottom"><div></div>
								<Dropdown.Toggle variant={sortBy ? "primary" : "outline-primary"} style={{ marginLeft: "10px" }} bsPrefix="no-damn-caret">
									<FaSortAmountDownAlt style={{ marginBottom: "3px" }} />
								</Dropdown.Toggle>
							</LinkWithTooltip>
							<Form className="form-inline">
							<Dropdown.Menu style={{ padding: "15px 15px 15px", minWidth: "300px"}}>
								{getLoc("editor_sort_by")}
								<InputGroup style={{ marginBottom: "5px" }}>
									<Form.Select id='filter-status-value' value={sortBy} onChange={(e) => {setSortBy(e.target.value)}}>
										<option value="">-- {getLoc("editor_sort_by_index")} --</option>
										<option value="last_tr_time">{getLoc("editor_sort_by_last_translation_time")}</option>
										<option value="last_str_time">{getLoc("editor_sort_by_last_string_change_time")}</option>
										<option value="tr_amount">{getLoc("editor_sort_by_translations_amount")}</option>
										<option value="vote_plus_amount">{getLoc("editor_sort_by_votes_plus")}</option>
										<option value="vote_minus_amount">{getLoc("editor_sort_by_votes_minus")}</option>
										<option value="comments_amount">{getLoc("editor_sort_by_comments_amount")}</option>
									</Form.Select>
								</InputGroup>
							</Dropdown.Menu>
							</Form>
						</Dropdown>

						{userRole?.permissions?.can_manage_strings &&
						<LinkWithTooltip tooltip={getLoc("editor_edit_mode")}id="tooltip-settings" where="bottom">
							<Button variant={editMode ? "primary" : "outline-primary"} style={{ marginLeft: "10px" }} onClick={(e) => {
								if (editMode) {
									setEditMode(false)
								} else {
									setEditMode(true)
									setTranslationEdit(null)
									setInputTranslation(curString?.text || "")
									setInputText(curString.text)
									setInputKey(curString.key)
									setInputContext(curString.context)
									setInputMaxLength(curString.max_tr_length)
								}
							}} disabled={!(userRole?.permissions?.can_manage_strings)}><FaPencilAlt style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						}

						{userRole?.permissions?.can_manage_strings &&
						<LinkWithTooltip tooltip={getLoc("editor_move_mode")}id="tooltip-settings" where="bottom">
							<Button variant={moveMode ? "primary" : "outline-primary"} style={{ marginLeft: "10px" }} onClick={(e) => {
								setMoveMode(!moveMode)
								rearrange_strings = strings
								UpdateDrawStrings()
							}} disabled={!(filters.length == 0 && sections.length == 1 && userRole?.permissions?.can_manage_strings)}><FaArrowsAlt style={{ marginBottom: "3px" }} /></Button>
						</LinkWithTooltip>
						}

						
						<Dropdown>
							<LinkWithTooltip tooltip={getLoc("editor_dictionary_recomendations")} id="tooltip-settings" where="bottom">
								<Dropdown.Toggle variant="outline-primary" style={{ marginLeft: "10px" }} bsPrefix="no-damn-caret">
									<FaBook style={{ marginBottom: "3px" }} />
								</Dropdown.Toggle>
							</LinkWithTooltip>
							<Form>
							<Dropdown.Menu style={{padding: "15px 15px 15px", minWidth: "400px"}}>
								<Tabs defaultActiveKey="dictionary">
									<Tab eventKey="dictionary" title={getLoc("editor_dictionary")}>
										<table className="table align-items-center">
											<thead>
												<tr>
													<th scope="col">{getLoc("editor_dictionary_word")}</th>
													<th scope="col">{getLoc("editor_dictionary_translation")}</th>
													<th scope="col">{getLoc("editor_dictionary_description")}</th>
												</tr>
											</thead>
											<tbody>
												{dictionary.map((dict, index) =>
													<tr key={dict.word}>
														<td>{dict.word}</td>
														<td>{dict.translate}</td>
														<td>{dict.desc}</td>
													</tr>
												)}
											</tbody>
										</table>
										{userRole?.permissions?.can_manage_strings &&
											<Link to={`/projects/${link["project_id"]}#dictionary`} className="link-primary">
												<Button type="submit" variant="primary">
													{getLoc("editor_go_to_dictionary")}
												</Button>
											</Link>
										}
									</Tab>
									{project?.recomendations && 
										<Tab eventKey="recomendations" title={getLoc("editor_recomendations")}>
											<div style={{margin: "5px", whiteSpace: "pre-wrap"}}>
												{project?.recomendations}
											</div>
										</Tab>
                                    }
								</Tabs>
							</Dropdown.Menu>
							</Form>
						</Dropdown>
					</Col>
					<Col className="py-1 d-inline-flex align-items-center">
						{ maxPage > 1 && !moveMode &&
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
			<Container>
				{/* <FilterForm/> */}
			</Container>
			<Container fluid style={{ height: "80%" }}>
			{!moveMode 
				? 	
					<Row  style={{ height: "100%", width: "100%" }}>
					{drawStrings.length
					? <>
						<Col className="border-bottom" style={{ height: "100%", padding: "0px", overflowY: "auto" }} >
							{drawStrings.slice((curPage - 1) * page_size, curPage * page_size).map((str, i) =>
								<>
								<Container id={`str${str.id}`} onClick={ async (e) => SelectString(str.index) } key={str.id} fluid style={{ margin: "0px", padding: "0px", paddingLeft: "0px", backgroundColor: (str.index == curString?.index ? "rgb(240, 240, 240)" : "white") }} className="border d-flex justify-content-between">
									<Col style={{ maxWidth: "4%", display: "flex", flexFlow: "column" }}>
										{userRole?.permissions?.can_manage_strings ?
											<Dropdown style={{ alignItems: "center", flexGrow: "1" }}>
												<Dropdown.Toggle style={{height: "100%", width: "100%"}} variant="outline" data-toggle="dropdown">
												</Dropdown.Toggle>
												<Dropdown.Menu>
													<Dropdown.Item onClick={(e) => {
														if (window.confirm(getLoc("editor_are_you_sure")))
															DeleteString(str.index)
													}}>{getLoc("editor_delete_string")}</Dropdown.Item>
													{filters.length == 0 && sections.length == 1 && 
													<Dropdown.Item onClick={(e) => {
														AddString(str.index + 1)
													}}>{getLoc("editor_add_string")}</Dropdown.Item>
													}
												</Dropdown.Menu>
											</Dropdown>
											: <div style={{flexGrow: "1"}}></div>
										}
										<div style={{ width: "100%", display: "flex", justifyContent: "center" }} onClick={(e) => {
											if (str.show_comments)
												CloseComments(str)
											else
												OpenComments(str)
										}}>
											<div style={{ marginBottom: "10px", marginTop: "10px" }}>
												{str.show_comments
													? <FaCommentAlt/>
													: <FaRegCommentAlt/>
												}
											<span style={{fontSize: "smaller"}}> {str.comments?.length && GetCommentsAmount(str.comments || []) || ""}</span>
											</div>
										</div>
									</Col>
									<Col style={{ marginRight: "0px", minWidth: "50%", marginLeft: "0px", paddingBottom: "4px" }}>
										{/* <Form.Check.Label>{str.key}</Form.Check.Label> */}
										<Stack className="border-end border-start" style={{height: "100%", position: "relative", whiteSpace: "pre-wrap", paddingLeft: "5px"}}>
											<div
												readOnly
												className="text-left text-break"
												style={{ paddingTop: "5px" }}
											>
												{str?.draw_text_f || str?.draw_text || str.text}
											</div>
											<div className="text-left text-break" style={{position: "relative", bottom: "0"}}>
												<div style={{color: "rgb(148, 148, 148)", fontStyle: "italic"}}>
													{str?.draw_key || str.key}
												</div>
												<div>
													<a href={`/projects/${link["project_id"]}/editor/${link["sections_list"]}#${str.index + 1}`} onClick={(e) => {PseudoReload(str.index)}}>#{str.index + 1}</a> 
													{sections.length > 1 &&
														<span className="cutoff" style={{ color: "rgb(148, 148, 148)", fontStyle: "italic", marginLeft: "4px" }}>
															{sections[str.sec_ind].name}
														</span>
													}
												</div>	
											</div>	
										</Stack>
									</Col>
									<Col>
										<Stack className="border-start" style={{height: "100%", whiteSpace: "pre-wrap"}}>
											{str.translations.map((tr, ind) => {
												if (ind == 0) {
													return <>
													<Stack style={{paddingLeft: "5px"}}>
														<div className="text-left text-break" style={{ paddingTop: "5px" }}>
															{tr?.draw_text || tr.text}
														</div>	
														<div className="cutoff" style={{ color: "rgb(148, 148, 148)", fontStyle: "italic" }}>
															{translators.length && (translators.find((el) => el.id == tr.author_id)?.username || "noname") || ""}
														</div>
													</Stack></>
												} else {
													return <>
													<Stack style={{paddingLeft: "5px", opacity: "0.3"}} className="border-top">
														<div className="text-left text-break" style={{ paddingTop: "5px" }}>
															{tr?.draw_text || tr.text}
														</div>	
														<div className="cutoff" style={{ color: "rgb(148, 148, 148)", fontStyle: "italic" }}>
															{translators.length && (translators.find((el) => el.id == tr.author_id)?.username || "noname") || ""}
														</div>
													</Stack></>
												}
											})}
											
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
								{str.show_comments &&
									<Container>
									{str.comments.map(com => 
										DrawComment(com, str)
									)}
									<div style={{ marginLeft: "8px", marginTop: "8px", marginBottom: "8px" }}>
										<Form.Control className="d-flex align-items-start"
											as="textarea"
											maxLength={400}
											placeholder={getLoc("editor_comments_placeholder")}
											style={{ wordWrap: "break-word", marginBottom: "4px" }}
											id={`comment-input-string-${str.id}`}
										>
										</Form.Control>
										{!loading 
										? 	<><Button variant="outline-success" className="comment-button" onClick={async () => {
												const input = document.getElementById(`comment-input-string-${str.id}`)
												if (input.value != "") {
													await PostComment(input.value, str)
													input.value = ""
												}
											}}>{getLoc("editor_comments_add")} </Button>
											<Button variant="outline-danger" className="comment-button" onClick={() => {CloseComments(str)}}>{getLoc("editor_comments_close")} </Button></>
										
										: 	<><Button variant="outline-success" className="comment-button"><Spinner animation="border" role="output" size="sm"/> {getLoc("editor_comments_add")} </Button>
											<Button variant="outline-danger" className="comment-button"><Spinner animation="border" role="output" size="sm"/> {getLoc("editor_comments_close")}</Button></>
										}
									</div>
									</Container>
								}
								
								</>
							)}


						</Col>
						<Col style={{height: "100%", overflowY: "auto"}} className="border-start border-end border-bottom" md={4}>
						{curString 
						? <>
							{!editMode 
							? <>
								{userRole?.permissions?.can_translate &&
								<>
									<Form.Control className="d-flex align-items-start"
										onChange={translationChange}
										as="textarea"
										ref={textareaTranslate}
										value={inputTranslation}
										placeholder={getLoc("editor_translation_placeholder")}
										style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
									>
									</Form.Control>
									<h6> {curString?.context ? `${getLoc("editor_translation_context")}: ${curString?.context}` : `` }</h6>
									<div style={{ color: (inputTranslation.length > curString?.max_tr_length ? "red" : "black") }}>
										{inputTranslation.length}/{curString?.text.length} {curString?.max_tr_length < 2000 ? `(${getLoc("editor_translation_max_symbols")} ${curString?.max_tr_length})` : ""}
										{translateWarning &&
											<OverlayTrigger
												placement="top"
												overlay={
												<Tooltip>
													{translateWarning}
												</Tooltip>
												}
											>
												<Button variant="warning" size="sm"><CiWarning/></Button>
											</OverlayTrigger>
										}
									</div>

								
									{translationEdit 
										? 	<>
												{!loading 
													? <>
														<Button variant="outline-success" onClick={() => EditTranslation()} disabled={inputTranslation.length > curString?.max_tr_length}><FaPlus /> {getLoc("editor_translation_edit_save")} </Button>
														<Button variant="outline-danger" onClick={() => {
															setTranslationEdit(null)
															setInputTranslation("")
														}}><FaPlus /> {getLoc("editor_translation_edit_cancel")} </Button>
													</>
													:  <>
													<Button variant="outline-success" disabled><Spinner size="sm"/> {getLoc("editor_translation_edit_save")} </Button>
													<Button variant="outline-danger" disabled><Spinner size="sm"/> {getLoc("editor_translation_edit_cancel")} </Button>
													</>
												}
											</>
										: 	<>
												<div style={{ display: "flex", justifyContent: "space-between" }}>
												{!loading 
													? <Button variant="outline-success" onClick={() => AddTranslation()} disabled={inputTranslation.length > curString?.max_tr_length}><FaPlus /> {getLoc("editor_translation_add")} </Button>
													: <Button variant="outline-success" disabled><Spinner size="sm"/> {getLoc("editor_translation_add")} </Button>
												}
												<Button variant="outline-secondary" onClick={(e) => {
													setInputTranslation(curString.text)
												}}><FaCopy /></Button>
												</div>
											</>
									}
								</>
								}
								<h3>{getLoc("editor_translations")}</h3>
								<div style={{ overflowY: "auto" }}>
								{curString?.translations?.map((tr, i) =>
								<>
									<Container key={tr.id} className="border rounded" style={{ backgroundColor: (tr.id == translationEdit?.id ? "rgb(240, 240, 240)" : "white") }}>
										<div
											readOnly
											className="border rounded"
											style={{ marginTop: "10px", wordWrap: "break-word", whiteSpace: "pre-wrap" }}
										>
											{tr.text}
										</div>
										<div style={{ display: "flex", justifyContent: "space-between" }}>
											<div>
												<div>{getLoc("editor_translations_author")}: {translators.length && (translators.find((el) => el.id == tr.author_id)?.username || "noname") || ""}</div>
												{ tr.editor_id && 
													<div>{getLoc("editor_translations_editor")}: {translators.length && (translators.find((el) => el.id == tr.editor_id)?.username || "noname") || ""}</div>
												}
												<div>{new Date(tr.updated_at).toLocaleString()}</div>
											</div>
											<Button variant="outline-secondary" onClick={(e) => {
												setInputTranslation(tr.text)
											}}><FaRegCopy /></Button>
										</div>

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

												<Button variant="outline-danger" onClick={(e) => {
													if (window.confirm(getLoc("editor_are_you_sure")))
														DeleteTranslation(curString.id, tr.id)
												}} ><FaTrashAlt/></Button>
											</>
											: <>
												<Button variant="outline-primary" disabled><Spinner size="sm"/></Button>
												<Button variant="outline-danger" disabled><Spinner size="sm"/></Button>
											</>
										)}
										
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
								</div>
							</>
							: <>
								<h6>{getLoc("editor_string_text")}:</h6>
								<Form.Control className="d-flex align-items-start"
									onChange={textChange}
									as="textarea"
									value={inputText}
									placeholder={getLoc("editor_string_text_placeholder")}
									style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
								>
								</Form.Control>
								{sections[curString.sec_ind]?.type == "json" &&  <>
									<h6>{getLoc("editor_string_key")}:</h6>
									<Form.Control className="d-flex align-items-start"
										onChange={keyChange}
										as="textarea"
										value={inputKey}
										placeholder={getLoc("editor_string_key_placeholder")}
										style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
									>
									</Form.Control>
								</>}
								<h6>{getLoc("editor_string_context")}:</h6>
								<Form.Control className="d-flex align-items-start"
									onChange={contextChange}
									as="textarea"
									value={inputContext}
									placeholder={getLoc("editor_string_context_placeholder")}
									style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
								>
								</Form.Control>

								<h6>{getLoc("editor_string_max_length")}:</h6>
								<Form.Control type="number" onChange={maxLengthChange} min="1" max="2000" value={inputMaxLength} />
								{/* <input type="number" id="tentacles" name="tentacles" min="10" max="100" /> */}

							
								{!loading 
									? <>
										<Button variant={
											inputText != curString.text ||
											inputContext != curString.context ||
											inputKey != curString.key ||
											inputMaxLength != curString.max_tr_length
											? "success"
											: "outline-success"} onClick={() => SaveString()}><FaPlus /> {getLoc("editor_string_edit_save")} </Button>
										<Button variant="outline-danger" onClick={() => {
											setInputText(curString.text)
											setInputKey(curString.key)
											setInputContext(curString.context)
											setInputMaxLength(curString.max_tr_length)
										}}><FaPlus /> {getLoc("editor_string_edit_reset")}</Button>
									</>
									:  <>
									<Button variant="outline-success" disabled><Spinner size="sm"/> {getLoc("editor_string_edit_save")} </Button>
									<Button variant="outline-danger" disabled><Spinner size="sm"/> {getLoc("editor_string_edit_reset")} </Button>
									</>
								}
							</>
							}
						</>
						: <>
						</>
						}
						</Col>
					</>
					: <>
						{loadingStrings
						? <>
							<div style={{display: "flex", justifyContent: "center"}}>
							<div style={{marginTop: "10%"}}>
							<div style={{justifySelf: "center", }}><Spinner></Spinner></div>
							<h2>{getLoc("editor_strings_loading")}</h2>
							</div></div>
						</>
						: <>
							<div style={{display: "flex", justifyContent: "center"}}>
							<div style={{marginTop: "10%"}}>
							<h2 style={{textAlign: "center"}}>{getLoc("editor_no_strings_1")}</h2>
							<h2 style={{textAlign: "center"}}>{getLoc("editor_no_strings_2")}</h2>
							</div></div>
						</>	
						}
					</>
					}
					</Row>
				: <>
				<div id="div-strings-to-load" style={{ height: "95%", overflowY: "auto" }}>
					{drawStrings.map((str, i) => 
						<Container className="text-left text-break border rounded my-2 pt-3" id={`str${i}`} key={i} style={{whiteSpace: "pre-wrap"}} data-position={i} draggable={true} onDragStart={(e) => {
							setDraggedElem(e.currentTarget.dataset.position)
						}} 
						onDragOver={(e) => {
							e.preventDefault()
						}}
						onDragEnter={(e) => {
							MoveElemTo(e.currentTarget.dataset.position)
							e.preventDefault()
						}} 
						onDrop={(e) => {
							rearrange_strings = drawStrings
							e.preventDefault();
						}}>
						<p className="mb-1 fw-semibold">{str.text}</p>
						<p className="text-body-secondary mt-0">{str.key && <i> {getLoc("editor_strings_move_key")}: {str.key}</i>}</p>
						</Container>
					)}
				</div>
				<Button className="mt-2 me-2" type="submit" variant="primary" disabled={loading} onClick={SaveRearrange}>
					{loading
						?  <Spinner animation="border" role="output" size="sm">
							<span className="visually-hidden">{getLoc("editor_strings_move_loading")}</span>
						</Spinner>
						:  <span>{getLoc("editor_strings_move_save")}</span>
					}
				</Button>
				{!loading &&
					<Button className="mt-2" type="submit" variant="secondary" onClick={(e) => {
						setMoveMode(false)
						UpdateDrawStrings()
					}}>
						{getLoc("editor_strings_move_cancel")}
					</Button>
				}
				</>
			}
			</Container>
		</div>
		</>
	);
}