import { Link, useParams } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import Tab from "react-bootstrap/Tab"
import Tabs from "react-bootstrap/Tabs"
import Button from "react-bootstrap/Button"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import placeholder from "../images/placeholder.png"
import Spinner from 'react-bootstrap/Spinner';

import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { openConnection } from "../WSController";
import { fetchProject, fetchSections, fetchSomeAPI, fetchUser, fetchMembers, fetchProjectInvites, fetchStrings } from "../APIController";
import { ProgressBar, Stack } from "react-bootstrap";
import { FaRegTrashAlt, FaBars, FaTrashAlt, FaPlus, FaPenAlt } from "react-icons/fa"
import Dropdown from 'react-bootstrap/Dropdown';

const kostyl_lang_tr = {
    en: "Английский",
    ru: "Русский",
}

const kostyl_status_tr = {
    opened: "Открыт",
    closed: "Закрыт",
    frozen: "Заморожен",
}

function Project(props) {

    const { user } = useContext(AuthContext);

    const [project, setProject] = useState(null);
    const [dictionary, setDictionary] = useState([]);
    const [members, setMembers] = useState([]);
    const [sections, setSections] = useState([]);
    const [roles, setRoles] = useState([]);
    const [invites, setInvites] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [inviteError, setInviteError] = useState(null)
    const [fieldInviteUser, setFieldInviteUser] = useState([]);
    const [addChapterToggle, setAddChapterToggle] = useState(false);
    
    const [loading, setLoading] = useState(false)
    
    const [inputWord, setInputWord] = useState("")
    const [inputWordKey, setInputWordKey] = useState("")
    const [inputTranslate, setInputTranslate] = useState("")
    const [inputTranslateKey, setInputTranslateKey] = useState("")
    const [inputDescription, setInputDescription] = useState("")
    
    const [dictError, setDictError] = useState(null)
    const [editDict, setEditDict] = useState(null)

	const wordChange 		    = e => {
        setInputWord(e.target.value)
        document.getElementById("form-word-key").value = e.target.value
        setInputWordKey(e.target.value)
    }
	const wordKeyChange 		= e => setInputWordKey(e.target.value);
    const descriptionChange 	= e => setInputDescription(e.target.value);
	const translateChange 	    = e => {
        setInputTranslate(e.target.value)
        document.getElementById("form-translate-key").value = e.target.value
        setInputTranslateKey(e.target.value)
    }
	const translateKeyChange 	= e => setInputTranslateKey(e.target.value);

    const fieldInviteUserChange = event => setFieldInviteUser(event.target.value);

    const [fetchingInvite, setFetchingInvite] = useState(false)

    const link = useParams()

    async function GetProject() {
        try {
            let project = await fetchProject(link["project_id"], true, true, false)
            setProject(project)
            setMembers(project.members)
            setRoles(project.roles)
            
            project = await fetchProject(link["project_id"], true, true, true)
            setProject(project)
            setMembers(project.members)
            setRoles(project.roles)

            if (project.statistics) {
                project.statistics.completeness = project.statistics.strings_amount ? project.statistics.translated_strings_amount / project.statistics.strings_amount * 100 : 0
                project.statistics.completeness = Math.floor(project.statistics.completeness * 100) / 100
            }
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

    async function GetSections() {
        try {
            let sections = await fetchSections(link["project_id"], false)
            setSections(sections)
            
            sections = await fetchSections(link["project_id"], true)
            for (let sec of sections) {
                if (sec.statistics.strings_amount) {
                    sec.statistics.completeness = sec.statistics.strings_amount ? sec.statistics.translated_strings_amount / sec.statistics.strings_amount * 100 : 0
                    sec.statistics.completeness = Math.floor(sec.statistics.completeness * 100) / 100
                }
            }
            setSections(sections)
        } catch (err) {

        }
    }

    async function GetUserRole() {
        if (!user)
            return
        if (!members)
            return

        const member = members.find(member => member.user.id == user.id)
        if (!member) {
            setUserRole(null)
            return
        }

        setUserRole(roles[member.role_id])
    }

    async function GetDictionary() {
        try {
            let dict = await fetchSomeAPI(`/api/projects/${link["project_id"]}/dictionary`)
            console.log(dict)
            setDictionary(dict)
        } catch (err) {
            console.log(err)
        }
    }

    async function SendInvite() {
        if (fieldInviteUser == "")
            return
        
        setInviteError(null)
        setFetchingInvite(true)
        try {
            const user = await fetchUser(fieldInviteUser)
            await fetchSomeAPI(`/api/projects/${project.id}/invites`, "POST", { user_id: user.id })
            await GetInvites()
        } catch (err) {
            switch (err.status) {
                case 404:
                    setInviteError("Такого пользователя не существует"); break;
                case 400:
                    setInviteError("Пользователь уже является участником проекта"); break;
                case 409:
                    setInviteError("Пользователь уже приглашён"); break;
            }
            console.log(err)
        }
        setFetchingInvite(false)
    }

    async function KickMember(user_id) {
        try {
            await fetchSomeAPI(`/api/projects/${link["project_id"]}/members/${user_id}`, "DELETE")
            await GetProject()
        } catch (err) {
            console.log(err)
            // По идее, тут ошибок со стороны сервера быть не должно.
        }
    }

    async function DeleteInvite(invite_id) {
        try {
            await fetchSomeAPI(`/api/projects/${link["project_id"]}/invites/${invite_id}`, "DELETE")
            await GetInvites()
        } catch (err) {
            console.log(err)
        }
    }

    async function GetInvites() {
        if (!project)
            return

        if (!userRole?.permissions?.can_manage_members)
            return

        try {
            const invites = await fetchProjectInvites(project.id)
            setInvites(invites)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        // openConnection(`/projects/${link["project_id"]}`)
    }, [])

    useEffect(() => {
        GetProject()
        GetDictionary()
    }, [])

    useEffect(() => {
        GetUserRole()
    }, [project, user])

    useEffect(() => {
        if (!project || sections.length)
            return
        GetSections()
    }, [project])

    useEffect(() => {
        GetInvites()
    }, [userRole, project])

    // TODO
    // Поменять всё на ref вместо getElementById
    async function SubmitChanges() {
        try {
            await fetchSomeAPI(`/api/projects/${project.id}`, "PATCH", {
                name:           document.getElementById("settings-name").value,
                handle:         document.getElementById("settings-handle").value,
                description:    document.getElementById("settings-description").value,
                source_lang:    document.getElementById("settings-source-lang").value,
                target_lang:    document.getElementById("settings-target-lang").value,
                visibility:     document.getElementById("settings-access").value,
            })
            GetProject()
        } catch (err) {
            console.log(err)
        }
    }

    async function AddChapter() {
        setLoading(true)
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/sections`, "POST", {
                name: document.getElementById("inputSectionName").value
            })
            await GetSections()
            setAddChapterToggle(false)
        } catch (err) {
            console.log(err)
        }
        setLoading(false)
    }

    async function DeleteSection(section_id) {
        setLoading(true)
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/sections/${section_id}`, "DELETE")
            await GetSections()
        } catch (err) {
            console.log(err)
        }
        setLoading(false)
    }

    async function ChangeRole(user_id, role_id) {
        setLoading(true)
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/members/${user_id}/grant_role`, "POST", {
                role_id: role_id,
            })
            await GetProject()
        } catch (err) {
            console.log(err)
        }
        setLoading(false)
    }

    async function DownloadSectionOriginal(index) {
        const section = sections[index]
        let strings = await fetchStrings(project.id, section.id)
        if (strings.length == 0) {
            alert("А строк то нема")
            return
        }

        let filename = section.name

        let text = ''
        if (section.type == 'text') {
            for (const str of strings) {
                text += str.text + '\n'
            }
            filename += '.txt'
        } else if (section.type == 'json') {
            let strs = {}
            for (const str of strings) {
                strs[str.key] = str.text
            }
            text = JSON.stringify(strs, null, 4)
            filename += '.json'
        }
        console.log(text)

        DownloadFile(text, filename)
    }

    async function DownloadSectionTranslation(index) {
        const section = sections[index]
        let strings = await fetchStrings(project.id, section.id, true)
        if (strings.length == 0) {
            alert("А строк то нема")
            return
        }

        let filename = section.name

        let text = ""
        if (section.type == 'text') {
            for (const str of strings) {
                text += (str.translations?.[0]?.text || str.text) + '\n'
            }
            filename += '.txt'
        } else if (section.type == 'json') {
            let strs = {}
            for (const str of strings) {
                strs[str.key] = (str.translations?.[0]?.text || str.text)
            }
            text = JSON.stringify(strs, null, 4)
            filename += '.json'
        }

        DownloadFile(text, filename)
    }

    async function DownloadProjectTranslation() {
        setLoading(true)
        try {
            let strings = []
            let type = sections[0].type
            for (const sec of sections) {
                if ((sec.type == "json" && type == "text") || (sec.type == "text" && type == "json")) {
                    alert("Я без понятия, как смешать обычный текст и JSON")
                    return
                }
                let strs = await fetchStrings(project.id, sec.id, true)
                for (let str of strs) {
                    strings.push(str)
                }
            }
            // await fetchStrings(project.id, section.id, true)
            if (strings.length == 0) {
                alert("А строк то нема")
                return
            }

            let filename = project.name

            let text = ""
            if (type == 'text') {
                for (const str of strings) {
                    text += (str.translations?.[0]?.text || str.text) + '\n'
                }
                filename += '.txt'
            } else if (type == 'json') {
                let strs = {}
                for (const str of strings) {
                    strs[str.key] = (str.translations?.[0]?.text || str.text)
                }
                text = JSON.stringify(strs, null, 4)
                filename += '.json'
            }

            DownloadFile(text, filename)
        } catch (err) {
            console.log(err)
        }

        setLoading(false)
    }

    async function DownloadFile(text, filename) {
        var element = document.createElement('a')
        element.setAttribute('href',
            'data:text/plain;charset=utf-8,'
            + encodeURIComponent(text))
        element.setAttribute('download', filename)
        document.body.appendChild(element)
        element.click()

        document.body.removeChild(element)
    }

    async function DeleteProject() {
        await fetchSomeAPI(`/api/projects/${project.id}`, "DELETE")
        window.location.href = '/'
    }

    function UploadTranslations(section_id) {
        window.location.href = `/projects/${project.id}/sections/${section_id}/upload_translations`
    }

    function TimestampToTimeSince(timestamp) {
        if (timestamp == 0)
            return ""
        const delta = (Date.now() - timestamp) / 1000
        if (delta < 60)
            return `${Math.round(delta)} сек. назад`
        if (delta < 60 * 60)
            return `${Math.round(delta / 60)} мин. назад`
        if (delta < 60 * 60 * 24)
            return `${Math.round(delta / 60 / 60)} час. назад`
        if (delta < 60 * 60 * 24 * 30)
            return `${Math.round(delta / 60 / 60 / 24)} дн. назад`
        if (delta < 60 * 60 * 24 * 30 * 12)
            return `${Math.round(delta / 60 / 60 / 24 / 30)} мес. назад`
        return `Больше года назад`
        // if($t < 60) return $this->idle_time . " сек.";
		// if($t < 60 * 60) return round($this->idle_time / 60) . " мин.";
		// if($t < 60 * 60 * 24) return round($this->idle_time / 3600) . " час.";
		// if($t < 60 * 60 * 24 * 30) return round($this->idle_time / 86400) . " дней.";
		// if($t < 60 * 60 * 24 * 30 * 12) return round($this->idle_time / 2592000) . " мес.";
		// return "> 1 года.";
    }

    async function DeleteDictEntry(dict_id) {
        setLoading(true)
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/dictionary/${dict_id}`, "DELETE")
            await GetDictionary()
        } catch (err) {
            console.log(err)
        }
        setLoading(false)
    }

    async function AddWord() {
        setLoading(true)
        setDictError(null)
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/dictionary`, "POST", {
                word: inputWord,
                word_key: inputWordKey,
                translate: inputTranslate,
                translate_key: inputTranslateKey,
                desc: inputDescription
            })
            await GetDictionary()
        } catch (err) {
            setDictError(JSON.stringify(err))
        }
        setLoading(false)
    }

    async function SaveWord() {
        setLoading(true)
        setDictError(null)
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/dictionary/${editDict}`, "PATCH", {
                word: inputWord,
                word_key: inputWordKey,
                translate: inputTranslate,
                translate_key: inputTranslateKey,
                desc: inputDescription
            })
            await GetDictionary()
        } catch (err) {
            setDictError(JSON.stringify(err))
        }
        setLoading(false)
    }
    
    return (
        <>
            <Header />
            <Container style={{ marginTop: 50 }}>
                <h1 className="my-4 text-break">{project?.name}</h1>
                <Tabs
                    defaultActiveKey="project"
                    id="project-id-tabs"
                    className="mb-3"
                >
                    <Tab eventKey="project" title="Проект">
                        <Row>
                            <Col xs={7}>
                                <img src={placeholder} height={250} alt="project cover" style={{ float: 'left', padding: '10px', margin: '10px 10px 0px 0px' }} className="border rounded" />
                                <Stack className="text-left text-break">
                                    <h3>Описание проекта</h3>
                                    <p style={{fontSize: "smaller"}}>{project?.description}</p>
                                </Stack>
                            </Col>
                            {project &&
                                <Col className="border-top border-start rounded py-3" style={{ marginTop: '5px', marginLeft: '0px', marginRight: '20px', paddingLeft: '20px' }}>
                                    <h3 className="py-2 border-bottom" style={{ marginTop: '-10px' }}>Информация</h3>
                                    <div className="py-2 border-bottom" style={{ marginTop: '-8px' }}><b>Язык оригинала:</b> {kostyl_lang_tr[project?.source_lang]}</div>
                                    <div className="py-2 border-bottom" style={{ marginTop: '-8px' }}><b>Язык перевода:</b> {kostyl_lang_tr[project?.target_lang]}</div>
                                    <div className="py-2 border-bottom"><b>Дата создания:</b> {new Date(project?.created_at).toLocaleDateString()}</div>
                                    <div className="py-2 border-bottom"><b>Статус:</b> {kostyl_status_tr[project?.status]}</div>
                                    {project?.statistics?.completeness
                                    ?   <div className="py-2 border-bottom"><b>Прогресс: {project?.statistics?.completeness}%</b>
                                            <div className="progress-stacked" style={{ margin: '10px 0px 5px 0px' }}>
                                                <ProgressBar className="progress" striped animated label={`${project?.statistics?.completeness}%`} style={{ width: project?.statistics?.completeness + '%' }} aria-valuenow={project?.statistics?.completeness} aria-valuemin={0} aria-valuemax={100}/>
                                            </div>
                                        </div>
                                    :   <div className="py-2 border-bottom"><b>Прогресс: <Spinner size="sm"/>%</b></div>
                                    }
                                    { userRole &&
                                    <div className="py-2 border-bottom"><b>Ваша роль:</b> {userRole?.name}</div>
                                    }
                                    
                                    {userRole?.permissions?.can_translate && sections?.length > 0 && sections.reduce((sum, sec) => sum + (sec.type != 'json'), 0) == 0 &&
                                        <Button onClick={(e) => window.location.href = `/projects/${link["project_id"]}/upload_translations`}>
                                            Загрузить перевод
                                        </Button>
                                    }
                                    {sections?.length > 0 &&
                                        <Button onClick={(e) => DownloadProjectTranslation()} disabled={loading}>
                                            {loading && <Spinner size="sm"/>}
                                            Скачать перевод
                                        </Button>
                                    }
                                </Col>
                            }
                        </Row>
                        <h2>Разделы</h2>
                        <Link to={`/projects/${link["project_id"]}/editor`} className="link-primary">
                            <Button type="submit" variant="primary">
                                Редактор
                            </Button>
                        </Link>
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th scope="col">№</th>
                                    <th scope="col">Название</th>
                                    <th scope="col">Прогресс</th>
                                    <th scope="col">Активность</th>
                                    <th scope="col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sections.map((section, index) =>
                                    <tr key={section.id}>
                                        <th scope="row">{index + 1}</th>
                                        <td>
                                        {!section.statistics || section?.statistics?.strings_amount > 0 &&
                                            <Link to={`/projects/${project.id}/editor/${section.id.toString(16)}`} className="link-primary">
                                                {section.name}
                                            </Link>
                                        }
                                        {section?.statistics?.strings_amount == 0 &&
                                            section.name
                                        }
                                            
                                        </td>
                                        {section?.statistics?.strings_amount > 0
                                            ?   <>{section.statistics.last_update
                                                    ? <td>{section.statistics.translated_strings_amount} / {section.statistics.strings_amount} ({section.statistics.completeness}%)</td>
                                                    : <td><Spinner size="sm"/></td>
                                                }</>
                                            :   <>   
                                                    <td>
                                                        <Link to={`/projects/${project.id}/sections/${section.id}/load_strings`} className="link-primary">
                                                            Загрузить строки
                                                        </Link>
                                                    </td>
                                                </>
                                        }
                                        <td>{section?.statistics?.last_update != undefined
                                            ? <span title={new Date(section?.statistics?.last_update).toLocaleString()}>{TimestampToTimeSince(section?.statistics?.last_update)}</span>
                                            : <span><Spinner size="sm"/></span>
                                        }</td>
                                        <td>
                                            <Dropdown>
                                                <Dropdown.Toggle data-toggle="dropdown">
                                                    <FaBars/>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item onClick={(e) => DownloadSectionTranslation(index)}>
                                                        Скачать перевод
                                                    </Dropdown.Item>
                                                {userRole?.permissions?.can_translate && section?.statistics?.strings_amount > 0 &&
                                                    <Dropdown.Item onClick={(e) => UploadTranslations(section.id)}>
                                                       Загрузить перевод
                                                    </Dropdown.Item>
                                                }
                                                    <Dropdown.Item onClick={(e) => DownloadSectionOriginal(index)}>
                                                        Скачать оригинал
                                                    </Dropdown.Item>
                                                {userRole?.permissions?.can_manage_sections && 
                                                    <Dropdown.Item onClick={(e) => DeleteSection(section.id)}>
                                                       Удалить
                                                    </Dropdown.Item>
                                                }
                                                </Dropdown.Menu>
                                            {/* {userRole?.permissions?.can_manage_sections && 
                                                <td><Button variant="danger" style={{ marginLeft: "10px" }} onClick={(e) => DeleteSection(section.id)}><FaRegTrashAlt style={{ marginBottom: "3px" }} /></Button></td>
                                            } */}
                                            </Dropdown>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {userRole?.permissions?.can_manage_sections && 
                            <Button type="submit" variant="primary" hidden={addChapterToggle} onClick={(e) => setAddChapterToggle(true)}>Добавить раздел</Button>
                        }
                        <Form className="mb-2" id="divAddChapter" hidden={!addChapterToggle}>
                            <Form.Control
                                type="text"
                                className="mb-2"
                                id="inputSectionName"
                                placeholder="Название главы"
                            />
                            {!loading  
                            ? <>
                                <Button className="me-2" type="submit" variant="primary" onClick={(e) => {e.preventDefault(); AddChapter()}}>
                                    Добавить
                                </Button>
                                <Button type="cancel" variant="outline-secondary" onClick={(e) => {e.preventDefault(); setAddChapterToggle(false)}}>
                                    Отмена
                                </Button>
                            </>
                            : <>
                                <Button className="me-2" type="submit" variant="primary" disabled><Spinner size="sm"/> Добавить</Button>
                                <Button type="cancel" variant="outline-secondary" disabled><Spinner size="sm"/> Отмена</Button>
                            </>}
                        </Form>
                    </Tab>
                    <Tab eventKey="dictionary" title="Словарь">
                        <div className="row">
                            <div className="col-8">
                                <h2>Словарь</h2>
                                <table className="table table-striped align-items-center">
                                    <thead>
                                        <tr>
                                            <th scope="col">Слово</th>
                                            <th scope="col">Перевод</th>
                                            <th scope="col">Описание</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dictionary.map((dict, index) =>
                                            <tr key={dict.word} className={(dict.id == editDict ? "table-secondary" : "")}>
                                                <td>{dict.word}</td>
                                                <td>{dict.translate}</td>
                                                <td>{dict.desc}</td>
                                                {(userRole?.permissions?.can_manage_strings) &&
                                                    <td style={{ display: 'inline-flexbox' }}>
                                                        <div style={{ textAlign: "right" }}>
                                                            <Button variant="primary" onClick={ function (e) { 
                                                                setEditDict(dict.id) 
                                                                setInputWord(dict.word)
                                                                setInputWordKey(dict.word_key)
                                                                setInputTranslate(dict.translate)
                                                                setInputTranslateKey(dict.translate_key)
                                                                setInputDescription(dict.desc)
                                                            } }>
                                                                <FaPenAlt/>
                                                            </Button>
                                                            <Button variant="danger" onClick={ function (e) { DeleteDictEntry(dict.id) } }>
                                                                <FaTrashAlt/>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                }
                                                <td></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {userRole?.permissions?.can_manage_strings &&
                                <div className="col border-top border-start rounded py-3" style={{ marginTop: '5px', marginLeft: '0px', marginRight: '20px', paddingLeft: '20px' }}>
                                    <h3 className="py-2 border-bottom" style={{ marginTop: '-5px' }}>Добавить слово</h3>
                                    <Form>
                                        <h6>Текст:</h6>
                                        <Form.Control className="d-flex align-items-start"
                                            onChange={wordChange}
                                            as="textarea"
                                            value={inputWord}
                                            placeholder="Слово"
                                            id="form-word"
                                            style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                        >
                                        </Form.Control>
                                        <h6>Ключ слова:</h6>
                                        <Form.Control className="d-flex align-items-start"
                                            onChange={wordKeyChange}
                                            as="textarea"
                                            value={inputWordKey}
                                            placeholder="Ключ слова"
                                            id="form-word-key"
                                            style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                        >
                                        </Form.Control>
                                        <h6>Перевод:</h6>
                                        <Form.Control className="d-flex align-items-start"
                                            onChange={translateChange}
                                            as="textarea"
                                            value={inputTranslate}
                                            placeholder="Перевод слова"
                                            id="form-translate"
                                            style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                        >
                                        </Form.Control>
                                        <h6>Ключ перевода:</h6>
                                        <Form.Control className="d-flex align-items-start"
                                            onChange={translateKeyChange}
                                            as="textarea"
                                            value={inputTranslateKey}
                                            placeholder="Ключ перевода"
                                            id="form-translate-key"
                                            style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                        >
                                        </Form.Control>
                                        <h6>Описание:</h6>
                                        <Form.Control className="d-flex align-items-start"
                                            onChange={descriptionChange}
                                            as="textarea"
                                            value={inputDescription}
                                            placeholder="Описание"
                                            id="form-description"
                                            style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                        >
                                        </Form.Control>
                                    
                                        {!loading 
                                            ? <>{!editDict
                                                ? <>
                                                    <Button type="submit" variant="outline-success" onClick={() => AddWord()}><FaPlus /> Добавить </Button>
                                                </>
                                                : <>
                                                    <Button type="submit" variant="outline-success" onClick={() => SaveWord()}><FaPlus /> Сохранить </Button>
                                                    <Button variant="outline-danger" onClick={() => {
                                                        setEditDict(null)
                                                    }}><FaPlus /> Отмена </Button>
                                                </>
                                            }</>
                                            :  <>{!editDict
                                                ? <>
                                                    <Button variant="outline-success" disabled><Spinner size="sm"/> Добавить </Button>
                                                </>
                                                : <>
                                                    <Button variant="outline-success" disabled><Spinner size="sm"/> Сохранить </Button>
                                                    <Button variant="outline-danger" disabled><Spinner size="sm"/> Отмена </Button>
                                                </>
                                            }</>
                                        }
                                    </Form>
                                    {dictError && 
                                        <div id="dictError" className="form-text">
                                            {dictError}
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </Tab>
                    <Tab eventKey="members" title="Участники">
                        <div className="row">
                            <div className="col-8">
                                <h2>Участники перевода</h2>
                                <table className="table table-striped align-items-center">
                                    <thead>
                                        <tr>
                                            <th scope="col">№</th>
                                            <th scope="col">Пользователь</th>
                                            <th scope="col">Роль</th>
                                            <th scope="col">Рейтинг</th>
                                            <th scope="col"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member, index) =>
                                            <tr key={member.user.id}>
                                                <th scope="row">{index + 1}</th>
                                                <td><Link to={"/users/" + member.user.id} reloadDocument className="nav-link link-primary px-2">
                                                        {member.user.username}
                                                    </Link>
                                                </td>
                                                {!roles[member.role_id].permissions.can_manage_members && userRole?.permissions?.can_manage_members || (userRole?.permissions.is_owner && user?.id != member.user.id)
                                                ?   <Form.Select defaultValue={member.role_id} onChange={(e) => ChangeRole(member.user.id, e.target.value)}>
                                                    {Object.keys(roles).filter((id) => id != '0' && (!roles[id].permissions.can_manage_members || userRole?.permissions.is_owner)).map((id, index) =>
                                                            <option value={id} key={id}>{roles[id].name}</option>
                                                    )}
                                                    </Form.Select>
                                                :   <td>{roles[member.role_id].name}</td>
                                                }
                                                <td>0</td>
                                                {(!roles[member.role_id].permissions.can_manage_members && userRole?.permissions?.can_manage_members || (userRole?.permissions.is_owner && user?.id != member.user.id)) &&
                                                    <td style={{ display: 'inline-flexbox' }}><button type="button" className="btn btn-outline-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { KickMember(member.user.id) } }>Исключить</button></td>
                                                }
                                                {user?.id == member.user.id && project.owner_id != user?.id && 
                                                    <td style={{ display: 'inline-flexbox' }}><button type="button" className="btn btn-outline-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { KickMember(member.user.id) } }>Покинуть проект</button></td>
                                                }
                                                <td></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {invites.length > 0 &&
                                <>
                                    <h2>Приглашённые</h2>
                                    <table className="table table-striped align-items-center">
                                        <thead>
                                            <tr>
                                                <th scope="col">№</th>
                                                <th scope="col">Пользователь</th>
                                                <th scope="col">Приглашён</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {invites.map((invite, index) =>
                                            // Соня, сделай список приглашений красиво
                                            <tr key={invite.user.id}>
                                                <th scope="row">{index + 1}</th>
                                                <td>
                                                <Link to={"/users/" + invite.user.id} reloadDocument className="nav-link link-primary px-2">
                                                    {invite.user.username}
                                                </Link>
                                                </td>
                                                <td>
                                                <Link to={"/users/" + invite.inviter.id} reloadDocument className="nav-link link-primary px-2">
                                                    {invite.inviter.username}
                                                </Link></td>
                                                {userRole?.permissions?.can_manage_members &&
                                                    <td style={{ display: 'inline-flexbox' }}><button type="button" className="btn btn-outline-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { DeleteInvite(invite.id) } }>Отменить</button></td>
                                                }
                                            </tr>
                                            )
                                        }
                                        </tbody>
                                    </table>
                                </>
                                }
                            </div>
                            {userRole?.permissions?.can_manage_members &&
                                <div className="col border-top border-start rounded py-3" style={{ marginTop: '5px', marginLeft: '0px', marginRight: '20px', paddingLeft: '20px' }}>
                                    <h3 className="py-2 border-bottom" style={{ marginTop: '-5px' }}>Пригласить участника</h3>
                                    <form style={{ marginTop: '10px' }}>
                                        <input className="form-control" placeholder="Введите ник пользователя" aria-label="Invite" onChange={fieldInviteUserChange} />
                                        <button className="btn btn-primary" style={{ marginTop: '10px', marginBottom: '5px' }} disabled={fetchingInvite} onClick={(e) => {e.preventDefault(); SendInvite()}}>
                                            {fetchingInvite
                                             ?  <Spinner animation="border" role="output" size="sm">
                                                    <span className="visually-hidden">Загрузка...</span>
                                                </Spinner>
                                             :  <span>Пригласить</span>
                                            }
                                        </button>
                                    </form>
                                    {inviteError && 
                                        <div id="inviteError" className="form-text">
                                            {inviteError}
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </Tab>
                    {userRole?.permissions?.can_manage_project &&
                        <Tab eventKey="settings" title="Настройки">
                            <h2 style={{ marginTop: '20px', marginBottom: '20px' }}>Настройки проекта</h2>
                            <div className="row">
                                <div className="border rounded py-3" style={{ padding: '0px 20px', margin: '0px 20px' }}>
                                    <form className="row">
                                        <label htmlFor="settings-handle" className="form-label">Уникальная ссылка</label>
                                        <div className="col-3">
                                            <input type="text" className="form-control" id="settings-handle" minLength={4} maxLength={100} defaultValue={project.handle}/>
                                        </div>
                                        {/* <div className="col">
                                            <button className="btn btn-primary" type="submit">Применить</button>
                                        </div> */}
                                    </form>
                                    <form>
                                        <label htmlFor="settings-name" className="form-label" style={{ marginTop: '10px' }}>Название проекта</label>
                                        <input type="text" className="form-control" id="settings-name" defaultValue={project.name} minLength={4} maxLength={100} />
                                        <label htmlFor="settings-description" className="form-label" style={{ marginTop: '10px' }}>Описание проекта</label>
                                        <textarea className="form-control" aria-label="With textarea" id="settings-description" maxLength={1000} defaultValue={project.description} />
                                        {/* <label htmlFor="settings-logo" className="form-label" style={{ marginTop: '10px' }}>Сменить обложку</label>
                                        <input type="file" className="form-control" id="settings-logo" accept="image/png, image/jpeg" aria-describedby="logo-desc" />
                                        <div id="logo-desc" className="form-text">Принимаются картинки в формате png и jpeg.</div> */}
                                        {/* <label htmlFor="settings-author" className="form-label" style={{ marginTop: '10px' }}>Владелец проекта</label>
                                        <input type="text" className="form-control" id="settings-author" defaultValue="Нынешний владелец" /> */}
                                        <label htmlFor="settings-source-lang" className="form-label" style={{ marginTop: '10px' }}>Язык оригинала</label>
                                        <select className="form-select" defaultValue={project.source_lang} id="settings-source-lang">
                                            <option value="ru">русский</option>
                                            <option value="en">английский</option>
                                            <option value="de">немецкий</option>
                                            <option value="fr">французский</option>
                                        </select>
                                        <label htmlFor="settings-target-lang" className="form-label" style={{ marginTop: '10px' }}>Язык перевода</label>
                                        <select className="form-select" defaultValue={project.target_lang} id="settings-target-lang">
                                            <option value="ru">русский</option>
                                            <option value="en">английский</option>
                                            <option value="de">немецкий</option>
                                            <option value="fr">французский</option>
                                        </select>
                                        <label htmlFor="settings-access" className="form-label" style={{ marginTop: '10px' }}>Видимость проекта</label>
                                        <select className="form-select" defaultValue={project.visibility} id="settings-access">
                                            <option value="private">Приватный проект</option>
                                            <option value="public">Публичный проект</option>
                                        </select>
                                        {/* <label htmlFor="settings-category" className="form-label" style={{ marginTop: '10px' }}>Категория</label>
                                        <select className="form-select" defaultValue="none" id="settings-category" aria-describedby="category-desc">
                                            <option value="none">Не выбрано</option>
                                            <option value="movie">Фильмы</option>
                                            <option value="text">Тексты</option>
                                            <option value="program">Программы</option>
                                        </select>
                                        <div id="category-desc" className="form-text">* Если вы выбрали категорию, и ваш проект публичный,
                                            он будет отображаться в соответствующей категории во вкладке "Публичные переводы".
                                            Приватные проекты не будут отображаться в этой вкладке вне зависимости от категории.
                                        </div>
                                        <label htmlFor="settings-status" className="form-label" style={{ marginTop: '10px' }}>Статус</label>
                                        <div className="form-check">
                                            <input type="radio" name="radios" className="form-check-input" id="settings-status-opened" defaultValue="opened" defaultChecked />
                                            <label className="form-check-label" htmlFor="settings-status-opened">Проект открыт</label>
                                        </div>
                                        <div className="form-check">
                                            <input type="radio" name="radios" className="form-check-input" id="settings-status-frozen" defaultValue="frozen" />
                                            <label className="form-check-label" htmlFor="settings-status-frozen">Проект заморожен</label>
                                        </div>
                                        <div className="form-check">
                                            <input type="radio" name="radios" className="form-check-input" id="settings-status-closed" defaultValue="closed" />
                                            <label className="form-check-label" htmlFor="settings-status-closed">Проект закрыт</label>
                                        </div>
                                        <div id="status-desc" className="form-text">* Статус проекта отображается на странице проекта. Вы можете пометить проект как замороженный, чтобы обозначить,
                                            что временно не будете над ним работать, или как закрытый, если работа завершена и не будет продолжаться.
                                        </div> */}
                                    </form>
                                    <Button variant="primary" type="submit" style={{ marginTop: '20px' }} onClick={SubmitChanges}>Применить</Button>
                                    { userRole?.permissions?.is_owner && 
                                    <div><Button variant="danger" type="submit" style={{ marginTop: '20px' }} onClick={DeleteProject}>Удалить проект</Button></div>
                                    }
                                </div>
                            </div>
                        </Tab>
                    }
                </Tabs>
            </Container>
            <Footer />
        </>
    );
}

export default Project;
