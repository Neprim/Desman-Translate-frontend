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
import { fetchProject, fetchSections, fetchSomeAPI, fetchUser, fetchMembers, fetchProjectInvites, fetchUserInvites, fetchStrings } from "../APIController";
import { ProgressBar, Stack } from "react-bootstrap";
import { FaRegTrashAlt, FaBars, FaTrashAlt, FaPlus, FaPenAlt } from "react-icons/fa"
import Dropdown from 'react-bootstrap/Dropdown';
import { getLoc } from "../Translation"

function Project(props) {

    const { user } = useContext(AuthContext);

    const [project, setProject] = useState(null);
    const [dictionary, setDictionary] = useState([]);
    const [members, setMembers] = useState([]);
    const [sections, setSections] = useState(null);
    const [roles, setRoles] = useState([]);
    const [invites, setInvites] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [inviteError, setInviteError] = useState(null)
    const [fieldInviteUser, setFieldInviteUser] = useState([]);
    const [addChapterToggle, setAddChapterToggle] = useState(false);

    const [statistics, setStatistics] = useState(null)
    const [curStatSection, setCurStatSection] = useState("--summary--")
    const [statsLoading, setStatsLoading] = useState(false)

    const [requestedInvite, setRequestedInvite] = useState(false);
    
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
            
            // project = await fetchProject(link["project_id"], true, true, true)
            // setProject(project)
            // setMembers(project.members)
            // setRoles(project.roles)

            if (project.stats) {
                project.stats.completeness = project.stats.strings_amount ? project.stats.strings_translated / project.stats.strings_amount * 100 : 0
                project.stats.completeness = Math.floor(project.stats.completeness * 100) / 100
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
            
            // sections = await fetchSections(link["project_id"], true)
            for (let sec of sections) {
                if (sec.stats.strings_amount) {
                    sec.stats.completeness = sec.stats.strings_amount ? sec.stats.strings_translated / sec.stats.strings_amount * 100 : 0
                    sec.stats.completeness = Math.floor(sec.stats.completeness * 100) / 100
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
            GetInvite()
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
                    setInviteError(getLoc("project_invite_error_404")); break;
                case 400:
                    setInviteError(getLoc("project_invite_error_400")); break;
                case 409:
                    setInviteError(getLoc("project_invite_error_409")); break;
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

    async function ResolveInvite(invite_id, accept) {
        try {
            await fetchSomeAPI(`/api/projects/${link["project_id"]}/invites/${invite_id}`, "POST", {
                accept: accept,
            })
            GetProject()
            await GetInvites()
        } catch (err) {
            console.log(err)
        }
    }

    async function GetInvite() {
        try {
            const invites = await fetchUserInvites(false, false) || []
            console.log(invites)
            if (invites.find((inv) => inv.project_id == project.id)) {
                setRequestedInvite(true)
            }
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
        if (!project || sections?.length)
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
                cover_url:      document.getElementById("settings-cover").value,
            })
            GetProject()
            window.location.reload()
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
            alert(getLoc("project_section_download_original_no_strings"))
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
            alert(getLoc("project_section_download_translation_no_strings"))
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
                    alert(getLoc("project_download_translation_different_sections_types"))
                    throw "different sections types"
                }
                let strs = await fetchStrings(project.id, sec.id, true)
                for (let str of strs) {
                    strings.push(str)
                }
            }
            // await fetchStrings(project.id, section.id, true)
            if (strings.length == 0) {
                alert(getLoc("project_download_translation_no_strings"))
                throw "empty sections"
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
            return `${Math.round(delta)} ${getLoc("project_section_seconds_ago")}`
        if (delta < 60 * 60)
            return `${Math.round(delta / 60)} ${getLoc("project_section_minutes_ago")}`
        if (delta < 60 * 60 * 24)
            return `${Math.round(delta / 60 / 60)} ${getLoc("project_section_hours_ago")}`
        if (delta < 60 * 60 * 24 * 30)
            return `${Math.round(delta / 60 / 60 / 24)} ${getLoc("project_section_days_ago")}`
        if (delta < 60 * 60 * 24 * 30 * 12)
            return `${Math.round(delta / 60 / 60 / 24 / 30)} ${getLoc("project_section_months_ago")}`
        return `${getLoc("project_section_year_ago")}`
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

            setInputWord("")
            setInputWordKey("")
            setInputTranslate("")
            setInputTranslateKey("")
            setInputDescription("")
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
            
            setInputWord("")
            setInputWordKey("")
            setInputTranslate("")
            setInputTranslateKey("")
            setInputDescription("")
        } catch (err) {
            setDictError(JSON.stringify(err))
        }
        setLoading(false)
    }

    async function RequestInvite() {
        try {
            await fetchSomeAPI(`/api/projects/${project.id}/request_invite`, "POST")
            setRequestedInvite(true)
        } catch (err) {
            console.log(err)
        }
    }

    async function GetStatistics() {
        setStatsLoading(true)
        try {
            while (!project) {}
            while (!sections) {}

            let stats = await fetchSomeAPI(`/api/projects/${link["project_id"]}/statistics`)
            console.log(stats)
            let users = {}
            for (let user in stats.summary) {
                users[user] = await fetchUser(user)
            }
            let st = {}
            st["--summary--"] = []
            for (let user in stats["summary"]) {
                st["--summary--"].push({
                    ...stats["summary"][user],
                    translations_ratio: project.stats.translations_amount ? Math.round(stats["summary"][user].translations / project.stats.translations_amount * 10000) / 100 : 0,
                    current_ratio: project.stats.strings_translated ? Math.round(stats["summary"][user].current / project.stats.strings_translated * 10000) / 100 : 0,
                    approves_ratio: project.stats.strings_approved ? Math.round(stats["summary"][user].approves / project.stats.strings_approved * 10000) / 100 : 0,
                    id: users[user].id,
                    username: users[user].username,
                })
            }
            for (let sec in stats.sections) {
                st[sec] = []
                let section = sections.find((section) => section.id == sec)
                for (let user in stats.sections[sec]) {
                    console.log(user)
                    st[sec].push({
                        ...stats.sections[sec][user],
                        translations_ratio: section.stats.translations_amount ? Math.round(stats.sections[sec][user].translations / section.stats.translations_amount * 10000) / 100 : 0,
                        current_ratio: section.stats.strings_translated ? Math.round(stats.sections[sec][user].current / section.stats.strings_translated * 10000) / 100 : 0,
                        approves_ratio: section.stats.strings_approved ? Math.round(stats.sections[sec][user].approves / section.stats.strings_approved * 10000) / 100 : 0,
                        id: users[user].id,
                        username: users[user].username,
                    })
                }
            }

            setStatistics(st)
        } catch (err) {
            console.log(err)
        }
        
        setStatsLoading(false)
    }
    
    return (
        <>
            <Header />
            <Container style={{ marginTop: 50 }}>
                <h1 className="my-4 text-break">{project?.name}</h1>
                <Tabs
                    defaultActiveKey={window.location.hash.substring(1) == "dictionary" ? "dictionary" : "project"}
                    id="project-id-tabs"
                    className="mb-3"
                    onSelect={(e) => {
                        if (e == "statistics") {
                            if (!statistics && !statsLoading) {
                                GetStatistics()
                            }
                        }
                    }}
                >
                    <Tab eventKey="project" title={getLoc("project_project_tab")}>
                        <Row>
                            <Col xs={7}>
                                <img src={project?.cover_url || placeholder} height={250} width={250} alt={getLoc("project_project_cover_stub")} style={{ float: 'left', padding: '10px', margin: '10px 10px 0px 0px' }} className="border rounded" />
                                <Stack className="text-left text-break">
                                    <h3>{getLoc("project_project_description")}</h3>
                                    <p style={{fontSize: "smaller",  whiteSpace: "pre-wrap" }}>{project?.description}</p>
                                </Stack>
                            </Col>
                            {project &&
                                <Col className="border-top border-start rounded py-3" style={{ marginTop: '5px', marginLeft: '0px', marginRight: '20px', paddingLeft: '20px' }}>
                                    <h3 className="py-2 border-bottom" style={{ marginTop: '-10px' }}>{getLoc("project_project_information")}</h3>
                                    <div className="py-2 border-bottom" style={{ marginTop: '-8px' }}><b>{getLoc("project_project_source_lang")}:</b> {getLoc("lang_" + project?.source_lang)}</div>
                                    <div className="py-2 border-bottom" style={{ marginTop: '-8px' }}><b>{getLoc("project_project_target_lang")}:</b> {getLoc("lang_" + project?.target_lang)}</div>
                                    <div className="py-2 border-bottom"><b>{getLoc("project_project_creation_date")}:</b> {new Date(project?.created_at).toLocaleDateString(localStorage.getItem("lang"))}</div>
                                    <div className="py-2 border-bottom"><b>{getLoc("project_project_status")}:</b> {getLoc("project_project_status_" + project?.status)}</div>
                                    {project?.stats?.completeness
                                    ?   <div className="py-2 border-bottom"><b>{getLoc("project_project_completeness")}: {project?.stats?.completeness}%</b>
                                            <div className="progress-stacked" style={{ margin: '10px 0px 5px 0px' }}>
                                                <ProgressBar className="progress" striped animated label={`${project?.stats?.completeness}%`} style={{ width: project?.stats?.completeness + '%' }} aria-valuenow={project?.stats?.completeness} aria-valuemin={0} aria-valuemax={100}/>
                                            </div>
                                        </div>
                                    :   <div className="py-2 border-bottom"><b>{getLoc("project_project_completeness")}: <Spinner size="sm"/>%</b></div>
                                    }
                                    {user && <>
                                        { userRole
                                            ? <div className="py-2 border-bottom"><b>{getLoc("project_your_role")}:</b> {getLoc("role_" + userRole?.name)}</div>
                                            : !requestedInvite 
                                                ? <>    
                                                    <Button onClick={(e) => RequestInvite(e)}>
                                                    {getLoc("project_request_invite")}
                                                    </Button>
                                                </>
                                                : <>    
                                                    <Button disabled>
                                                    {getLoc("project_inivte_requested")}
                                                    </Button>
                                                </>
                                        }</>
                                    }
                                    
                                    {userRole?.permissions?.can_translate && sections?.length > 0 && sections.reduce((sum, sec) => sum + (sec.type != 'json'), 0) == 0 &&
                                        <Button onClick={(e) => window.location.href = `/projects/${link["project_id"]}/upload_translations`}>
                                            {getLoc("project_upload_translation")}
                                        </Button>
                                    }
                                    {user && sections?.length > 0 && sections.reduce((sum, sec) => sum + (sec.type != 'json'), 0) == 0 &&
                                        <Button onClick={(e) => DownloadProjectTranslation()} disabled={loading}>
                                            {loading && <Spinner size="sm"/>}
                                            {getLoc("project_download_translation")}
                                        </Button>
                                    }
                                </Col>
                            }
                        </Row>
                        <h2>{getLoc("project_sections")}</h2>
                        {user &&
                            <Link to={`/projects/${link["project_id"]}/editor`} className="link-primary">
                                <Button type="submit" variant="primary">
                                    {getLoc("project_editor")}
                                </Button>
                            </Link>
                        }
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th scope="col">{getLoc("project_section_numero")}</th>
                                    <th scope="col">{getLoc("project_section_name")}</th>
                                    <th scope="col">{getLoc("project_section_completeness")}</th>
                                    <th scope="col">{getLoc("project_section_activity")}</th>
                                    <th scope="col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sections?.map((section, index) =>
                                    <tr key={section.id}>
                                        <th scope="row">{index + 1}</th>
                                        <td>
                                        {!section.stats || section?.stats?.strings_amount > 0 &&
                                            <>
                                            {user 
                                                ?
                                                    <Link to={`/projects/${project.id}/editor/${section.id.toString(16)}`} className="link-primary">
                                                        {section.name}
                                                    </Link>
                                                :   <>{section.name}</>
                                            }
                                            </>
                                        }
                                        {section?.stats?.strings_amount == 0 &&
                                            section.name
                                        }
                                            
                                        </td>
                                        {section?.stats?.strings_amount > 0
                                            ?   <>{section.stats.last_update
                                                    ? <td>{section.stats.strings_translated} / {section.stats.strings_amount} ({section.stats.completeness}%)</td>
                                                    : <td><Spinner size="sm"/></td>
                                                }</>
                                            :   <>   
                                                    <td>
                                                        <Link to={`/projects/${project.id}/sections/${section.id}/load_strings`} className="link-primary">
                                                        {getLoc("project_section_upload_strings")}
                                                        </Link>
                                                    </td>
                                                </>
                                        }
                                        <td>{section?.stats?.last_update != undefined
                                            ? <span title={new Date(section?.stats?.last_update).toLocaleString(localStorage.getItem("lang"))}>{TimestampToTimeSince(section?.stats?.last_update)}</span>
                                            : <span><Spinner size="sm"/></span>
                                        }</td>
                                        <td>
                                        {user &&
                                            <Dropdown>
                                                <Dropdown.Toggle data-toggle="dropdown">
                                                    <FaBars/>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                <Dropdown.Item onClick={(e) => DownloadSectionTranslation(index)}>
                                                {getLoc("project_section_download_translation")}
                                                </Dropdown.Item>
                                                {userRole?.permissions?.can_translate && section?.stats?.strings_amount > 0 &&
                                                    <Dropdown.Item onClick={(e) => UploadTranslations(section.id)}>
                                                    {getLoc("project_section_upload_translation")}
                                                    </Dropdown.Item>
                                                }
                                                    <Dropdown.Item onClick={(e) => DownloadSectionOriginal(index)}>
                                                    {getLoc("project_section_download_original")}
                                                        
                                                    </Dropdown.Item>
                                                {userRole?.permissions?.can_manage_sections && 
                                                    <Dropdown.Item onClick={(e) => DeleteSection(section.id)}>
                                                        {getLoc("project_section_delete")}
                                                    </Dropdown.Item>
                                                }
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        }
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {userRole?.permissions?.can_manage_sections && 
                            <Button type="submit" variant="primary" hidden={addChapterToggle} onClick={(e) => setAddChapterToggle(true)}>{getLoc("project_section_add")}</Button>
                        }
                        <Form className="mb-2" id="divAddChapter" hidden={!addChapterToggle}>
                            <Form.Control
                                type="text"
                                className="mb-2"
                                id="inputSectionName"
                                placeholder={getLoc("project_section_name_placeholder")}
                            />
                            {!loading  
                            ? <>
                                <Button className="me-2" type="submit" variant="primary" onClick={(e) => {e.preventDefault(); AddChapter()}}>
                                {getLoc("project_add_section")}
                                </Button>
                                <Button type="cancel" variant="outline-secondary" onClick={(e) => {e.preventDefault(); setAddChapterToggle(false)}}>
                                {getLoc("project_cancel")}
                                </Button>
                            </>
                            : <>
                                <Button className="me-2" type="submit" variant="primary" disabled><Spinner size="sm"/> {getLoc("project_add_section")}</Button>
                                <Button type="cancel" variant="outline-secondary" disabled><Spinner size="sm"/> {getLoc("project_cancel")}</Button>
                            </>}
                        </Form>
                    </Tab>
                    {user &&
                        <Tab eventKey="dictionary" title={getLoc("project_dictionary_tab")}>
                            <div className="row">
                                <div className="col-8">
                                    <h2>{getLoc("project_dictionary")}</h2>
                                    <table className="table table-striped align-items-center">
                                        <thead>
                                            <tr>
                                                <th scope="col">{getLoc("project_dictionary_word")}</th>
                                                <th scope="col">{getLoc("project_dictionary_translate")}</th>
                                                <th scope="col">{getLoc("project_dictionary_description")}</th>
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
                                        <h3 className="py-2 border-bottom" style={{ marginTop: '-5px' }}>{getLoc("project_dictionary_add")}</h3>
                                        <Form>
                                            <h6>{getLoc("project_dictionary_text")}:</h6>
                                            <Form.Control className="d-flex align-items-start"
                                                onChange={wordChange}
                                                as="textarea"
                                                value={inputWord}
                                                placeholder={getLoc("project_dictionary_text_placeholder")}
                                                id="form-word"
                                                style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                            >
                                            </Form.Control>
                                            <h6>{getLoc("project_dictionary_key")}:</h6>
                                            <Form.Control className="d-flex align-items-start"
                                                onChange={wordKeyChange}
                                                as="textarea"
                                                value={inputWordKey}
                                                placeholder={getLoc("project_dictionary_key_placeholder")}
                                                id="form-word-key"
                                                style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                            >
                                            </Form.Control>
                                            <h6>{getLoc("project_dictionary_translate")}:</h6>
                                            <Form.Control className="d-flex align-items-start"
                                                onChange={translateChange}
                                                as="textarea"
                                                value={inputTranslate}
                                                placeholder={getLoc("project_dictionary_translate_placeholder")}
                                                id="form-translate"
                                                style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                            >
                                            </Form.Control>
                                            <h6>{getLoc("project_dictionary_translate_key")}:</h6>
                                            <Form.Control className="d-flex align-items-start"
                                                onChange={translateKeyChange}
                                                as="textarea"
                                                value={inputTranslateKey}
                                                placeholder={getLoc("project_dictionary_translate_key_placeholder")}
                                                id="form-translate-key"
                                                style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                            >
                                            </Form.Control>
                                            <h6>{getLoc("project_dictionary_description")}:</h6>
                                            <Form.Control className="d-flex align-items-start"
                                                onChange={descriptionChange}
                                                as="textarea"
                                                value={inputDescription}
                                                placeholder={getLoc("project_dictionary_description_placeholder")}
                                                id="form-description"
                                                style={{ marginTop: "10px", marginBottom: "10px", paddingTop: "5px", paddingLeft: "10px", minHeight: "85px", wordWrap: "break-word" }}
                                            >
                                            </Form.Control>
                                        
                                            {!loading 
                                                ? <>{!editDict
                                                    ? <>
                                                        <Button type="submit" variant="outline-success" onClick={() => AddWord()}><FaPlus /> {getLoc("project_dictionary_add_word")} </Button>
                                                    </>
                                                    : <>
                                                        <Button type="submit" variant="outline-success" onClick={() => SaveWord()}><FaPlus /> {getLoc("project_dictionary_save_word")} </Button>
                                                        <Button variant="outline-danger" onClick={() => {
                                                            setEditDict(null)
                                                        }}><FaPlus /> {getLoc("project_dictionary_cancel_word")} </Button>
                                                    </>
                                                }</>
                                                :  <>{!editDict
                                                    ? <>
                                                        <Button variant="outline-success" disabled><Spinner size="sm"/> {getLoc("project_dictionary_add_word")} </Button>
                                                    </>
                                                    : <>
                                                        <Button variant="outline-success" disabled><Spinner size="sm"/> {getLoc("project_dictionary_save_word")} </Button>
                                                        <Button variant="outline-danger" disabled><Spinner size="sm"/> {getLoc("project_dictionary_cancel_word")} </Button>
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
                    }
                    <Tab eventKey="members" title={getLoc("project_members_tab")}>
                        <div className="row">
                            <div className="col-8">
                                <h2>{getLoc("project_members")}</h2>
                                <table className="table table-striped align-items-center">
                                    <thead>
                                        <tr>
                                            <th scope="col">{getLoc("project_members_numero")}</th>
                                            <th scope="col">{getLoc("project_members_user")}</th>
                                            <th scope="col">{getLoc("project_members_role")}</th>
                                            <th scope="col">{getLoc("project_members_rating")}</th>
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
                                                            <option value={id} key={id}>{getLoc("role_" + roles[id].name)}</option>
                                                    )}
                                                    </Form.Select>
                                                :   <td>{getLoc("role_" + roles[member.role_id].name)}</td>
                                                }
                                                <td>0</td>
                                                {(!roles[member.role_id].permissions.can_manage_members && userRole?.permissions?.can_manage_members || (userRole?.permissions.is_owner && user?.id != member.user.id)) &&
                                                    <td style={{ display: 'inline-flexbox' }}><button type="button" className="btn btn-outline-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { KickMember(member.user.id) } }>{getLoc("project_members_kick")}</button></td>
                                                }
                                                {user?.id == member.user.id && project.owner_id != user?.id && 
                                                    <td style={{ display: 'inline-flexbox' }}><button type="button" className="btn btn-outline-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { KickMember(member.user.id) } }>{getLoc("project_members_leave")}</button></td>
                                                }
                                                <td></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {invites.length > 0 &&
                                <>
                                    <h2>{getLoc("project_members_invited")}</h2>
                                    <table className="table table-striped align-items-center">
                                        <thead>
                                            <tr>
                                                <th scope="col">{getLoc("project_members_numero")}</th>
                                                <th scope="col">{getLoc("project_members_user")}</th>
                                                <th scope="col">{getLoc("project_members_invited_by")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {invites.map((invite, index) =>
                                            <tr key={invite.user.id}>
                                                <th scope="row">{index + 1}</th>
                                                <td>
                                                <Link to={"/users/" + invite.user.id} reloadDocument className="nav-link link-primary px-2">
                                                    {invite.user.username}
                                                </Link>
                                                </td>
                                                <td>
                                                <Link to={"/users/" + invite.inviter.id} reloadDocument className="nav-link link-primary px-2">
                                                    {invite.inviter.id != invite.user.id && invite.inviter.username}
                                                </Link></td>
                                                {userRole?.permissions?.can_manage_members &&
                                                    <>{invite.inviter.id == invite.user.id
                                                        ?   <td style={{ display: 'inline-flexbox' }}>
                                                                <div><button type="button" className="btn btn-success" style={{ padding: '0px 5px' }} onClick={ function (e) { ResolveInvite(invite.id, true) } }>{getLoc("project_members_invite_approve")}</button></div>
                                                                <div><button type="button" className="btn btn-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { ResolveInvite(invite.id, false) } }>{getLoc("project_members_invite_refuse")}</button></div>
                                                            </td>
                                                        :   <td style={{ display: 'inline-flexbox' }}>
                                                                <button type="button" className="btn btn-outline-danger" style={{ padding: '0px 5px' }} onClick={ function (e) { DeleteInvite(invite.id) } }>{getLoc("project_members_invite_cancel")}</button>
                                                            </td>
                                                    }</>
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
                                    <h3 className="py-2 border-bottom" style={{ marginTop: '-5px' }}>{getLoc("project_members_invite_user")}</h3>
                                    <form style={{ marginTop: '10px' }}>
                                        <input className="form-control" placeholder={getLoc("project_members_invite_username_placeholder")} aria-label="Invite" onChange={fieldInviteUserChange} />
                                        <button className="btn btn-primary" style={{ marginTop: '10px', marginBottom: '5px' }} disabled={fetchingInvite} onClick={(e) => {e.preventDefault(); SendInvite()}}>
                                            {fetchingInvite
                                             ?  <Spinner animation="border" role="output" size="sm">
                                                    <span className="visually-hidden">{getLoc("project_members_invite_loading")}</span>
                                                </Spinner>
                                             :  <span>{getLoc("project_members_invite")}</span>
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
                    <Tab eventKey="statistics" title={getLoc("project_statistics_tab")}>
                        {statsLoading || !statistics
						? <>
							<div style={{display: "flex", justifyContent: "center"}}>
							<div><div style={{justifySelf: "center", }}><Spinner></Spinner></div>
							<h2>{getLoc("project_statistics_loading")}</h2>
							</div></div>
						</>
						: <>
                            <div className="row">
                                <div className="col-8">
                                    <h2>{getLoc("project_statistics")}</h2>
                                    <label htmlFor="statistics-section" className="form-label" style={{ marginTop: '10px' }}>{getLoc("project_statistics_section")}</label>
                                    <Form.Select className="form-select" defaultValue={curStatSection} id="settings-source-lang" onChange={(e) => {console.log(e.target.value)
                                        setCurStatSection(e.target.value)}}>
                                        <option value="--summary--">{getLoc("project_statistics_summary")}</option>
                                        {sections.map((sec) => 
                                            <option value={sec.id}>{sec.name}</option>
                                        )}
                                    </Form.Select>
                                    <table className="table table-striped align-items-center">
                                        <thead>
                                            <tr>
                                                <th scope="col">{getLoc("project_statistics_user")}</th>
                                                {/* <th scope="col">{getLoc("project_statistics_translated")}<hr/>{getLoc("project_statistics_current")}</th> */}
                                                {/* <th scope="col">
                                                    <tr class="border-bottom">{getLoc("project_statistics_translated")}</tr>
                                                    <tr>{getLoc("project_statistics_current")}</tr>
                                                </th> */}
                                                <th scope="col">{getLoc("project_statistics_translated")}</th>
                                                <th scope="col">{getLoc("project_statistics_current")}</th>
                                                <th scope="col">{getLoc("project_statistics_edits")}</th>
                                                <th scope="col">{getLoc("project_statistics_approves")}</th>
                                                <th scope="col">{getLoc("project_statistics_rating")}</th>
                                                <th scope="col">{getLoc("project_statistics_votes")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statistics[curStatSection].map((user, index) =>
                                                <tr key={user.id}>
                                                    <td><Link to={"/users/" + user.id} reloadDocument className="nav-link link-primary px-2">
                                                            {user.username}
                                                        </Link>
                                                    </td>
                                                    <td>{user.translations} ({user.translations_ratio}%)</td>
                                                    <td>{user.current} ({user.current_ratio}%)</td>
                                                    <td>{user.edits}</td>
                                                    <td>{user.approves} ({user.approves_ratio}%)</td>
                                                    <td>{user.rating[0] - user.rating[1]} (<span style={{color: "green"}}>{user.rating[0]}</span>/<span style={{color: "red"}}>{user.rating[1]}</span>)</td>
                                                    <td><span style={{color: "green"}}>{user.pluses}</span>/<span style={{color: "red"}}>{user.minuses}</span></td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>	
						}
                    </Tab>
                    {userRole?.permissions?.can_manage_project &&
                        <Tab eventKey="settings" title={getLoc("project_settings_tab")}>
                            <h2 style={{ marginTop: '20px', marginBottom: '20px' }}>{getLoc("project_settings")}</h2>
                            <div className="row">
                                <div className="border rounded py-3" style={{ padding: '0px 20px', margin: '0px 20px' }}>
                                    <form className="row">
                                        <label htmlFor="settings-handle" className="form-label">{getLoc("project_settings_handle")}</label>
                                        <div className="col-3">
                                            <input type="text" className="form-control" id="settings-handle" minLength={4} maxLength={100} defaultValue={project.handle}/>
                                        </div>
                                    </form>
                                    <form>
                                        <label htmlFor="settings-name" className="form-label" style={{ marginTop: '10px' }}>{getLoc("project_settings_name")}</label>
                                        <input type="text" className="form-control" id="settings-name" defaultValue={project.name} minLength={4} maxLength={100} />
                                        <label htmlFor="settings-description" className="form-label" style={{ marginTop: '10px' }}>{getLoc("project_settings_description")}</label>
                                        <textarea className="form-control" aria-label="With textarea" id="settings-description" maxLength={1000} defaultValue={project.description} />
                                        <label htmlFor="settings-cover" className="form-label" style={{ marginTop: '10px' }}>{getLoc("project_settings_cover_link")}</label>
                                        <input type="text" className="form-control" id="settings-cover" defaultValue={project.cover_url} maxLength={1000} />
                                        <label htmlFor="settings-source-lang" className="form-label" style={{ marginTop: '10px' }}>{getLoc("project_settings_source_lang")}</label>
                                        <select className="form-select" defaultValue={project.source_lang} id="settings-source-lang">
                                            <option value="ru">{getLoc("lang_ru")}</option>
                                            <option value="en">{getLoc("lang_en")}</option>
                                        </select>
                                        <label htmlFor="settings-target-lang" className="form-label" style={{ marginTop: '10px' }}>{getLoc("project_settings_target_lang")}</label>
                                        <select className="form-select" defaultValue={project.target_lang} id="settings-target-lang">
                                            <option value="ru">{getLoc("lang_ru")}</option>
                                            <option value="en">{getLoc("lang_en")}</option>
                                        </select>
                                        <label htmlFor="settings-access" className="form-label" style={{ marginTop: '10px' }}>{getLoc("project_settings_visibility")}</label>
                                        <select className="form-select" defaultValue={project.visibility} id="settings-access">
                                            <option value="private">{getLoc("project_settings_visibility_private")}</option>
                                            <option value="public">{getLoc("project_settings_visibility_public")}</option>
                                        </select>
                                    </form>
                                    <Button variant="primary" type="submit" style={{ marginTop: '20px' }} onClick={SubmitChanges}>{getLoc("project_settings_save")}</Button>
                                    { userRole?.permissions?.is_owner && 
                                    <div><Button variant="danger" type="submit" style={{ marginTop: '20px' }} onClick={DeleteProject}>{getLoc("project_settings_delete")}</Button></div>
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
