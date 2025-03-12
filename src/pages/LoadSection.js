import Header from "./Header";
import Footer from "./Footer";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { useEffect, useState, useContext } from "react"
// import { AuthContext } from "../AuthContext";
import { fetchSection, fetchSomeAPI, fetchStrings } from "../APIController";
import { Link, useParams } from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';
import { getLoc } from "../Translation";

export default function LoadSection() {

    // const { user } = useContext(AuthContext);

    const [section, setSection] = useState(null)
    const [stringsExists, setStringsExists] = useState(true)
    const [sectionType, setSectionType] = useState('text')
    const [stringsError, setStringsError] = useState(null)
    const [strings, setStrings] = useState(null)
    const [drawStrings, setDrawStrings] = useState(null)

    const [loadError, setLoadError] = useState(null)

    const [fetchingStringsLoad, setFetchingStringsLoad] = useState(false)

    const [draggedElem, setDraggedElem] = useState(-1)

    const link = useParams()

    async function GetSection() {
        try {
            const sec = await fetchSection(link['project_id'], link['section_id'])
            fetchStrings(link['project_id'], link['section_id']).then((strs) => {
                setStringsExists(strs.length > 0)
            })
            setSection(sec)
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

    useEffect(() => {
        GetSection()
    }, [])

    useEffect(() => {
        setDrawStrings(strings)
    }, [strings])

    async function TransformStrings(e) {
        e.preventDefault()
        setFetchingStringsLoad(true)
        try {
            setStringsError(null)
            const type = document.getElementById("settings-strings-type").value
            const loaded_strings = document.getElementById("settings-loaded-strings").value
            let strings = []

            if (type == 'text') {
                strings = loaded_strings.split("\n").filter((str) => str != "").map((str) => {return { text: str }})
            } else if (type == 'json') {
                let json
                try {
                    json = JSON.parse(loaded_strings)
                } catch (err) {
                    throw {errors: [getLoc("load_section_error_bad_json")]}
                }
                
                for (const key in json) {
                    if (typeof(json[key]) != 'string') {
                        throw {errors: [getLoc("load_section_error_nested_json")]}
                    }

                    strings.push({ text: json[key], key: key })
                }
            }
            if (!strings.length)
                throw {errors: [getLoc("load_section_error_no_strings")]}

            setSectionType(type)
            setStrings(strings)
        } catch (err) {
            console.log(err)
            setStringsError(err.errors[0])
        }
        setFetchingStringsLoad(false)
    }

    async function LoadStrings() {

        setFetchingStringsLoad(true)
        try {
            for (const str of strings) {
                if (!str.text) {
                    console.log(str)
                }
            }
            // console.log(strings)
            await fetchSomeAPI(`/api/projects/${link['project_id']}/sections/${link['section_id']}/strings`, "POST", strings)
            await fetchSomeAPI(`/api/projects/${link['project_id']}/sections/${link['section_id']}`, "PATCH", {type: sectionType})
            window.location.href = `/projects/${link['project_id']}/editor/${section.id.toString(16)}`
        } catch (err) {
            if (err.status == 413) {
                setLoadError(getLoc("load_section_error_too_many_strings"))
            } else if (err.status == 400 && err.errors[0].key == 'text' && err.errors[0].kind == "required") {
                setLoadError(getLoc("load_section_error_empty_strings"))
            } else {
                setLoadError(JSON.stringify(err))
            }
            console.log(err)
        }
        setFetchingStringsLoad(false)
    }

    function MoveElemTo(pos) {
        pos = Number(pos)
        if (draggedElem != -1) {
            const elem = strings[draggedElem]
            if (pos >= draggedElem) {
                setDrawStrings(strings.toSpliced(pos + 1, 0, elem).toSpliced(draggedElem, 1))
            } else if (pos < draggedElem) {
                setDrawStrings(strings.toSpliced(draggedElem, 1).toSpliced(pos, 0, elem))
            }
        }
    }

    function CheckStringsType() {
        const loaded_strings = document.getElementById("settings-loaded-strings").value
        try {
            JSON.parse(loaded_strings)
        } catch (err) {
            return
        }
        document.getElementById("settings-strings-type").value = "json"
    }


    return (
        <>
            <Header />
            <title>{getLoc("load_section_title")}"{section?.name}"</title>
            <div style={{margin: "10px", position: "absolute"}}>
                <Button variant="outline-dark" onClick={() => {window.location.href = `/projects/${link["project_id"]}`}}>{getLoc("go_back")}</Button>
            </div>
            <Container
                className="text-left mt-5 mx-auto"
                style={{
                    width: '40%',
                    minWidth: '300px',
                }}
            >
                {section && !strings &&
                    <>
                    {section.type &&
                        <p className="text-middle text-break"><i>{getLoc("load_section_attention")}</i></p>
                    }
                    <h1 style={{ marginBottom: 20 }} className="text-middle text-break">{getLoc("load_section_load_strings_sections")}"{section.name}"</h1>
                    <Form>
                        <Form.Group>
                            {stringsExists
                            ? <>
                                <Form.Label htmlFor="settings-strings-type" className="mt-2">{getLoc("load_section_type")}: {
                                    section.type == 'text'
                                    ? getLoc("upload_section_translations_type_text")
                                    : getLoc("upload_section_translations_type_json")    
                                }</Form.Label>
                                <Form.Select hidden defaultValue={section.type} id="settings-strings-type">
                                    <option value="text">{getLoc("load_section_type_text")}</option>
                                    <option value="json">{getLoc("load_section_type_json")}</option>
                                </Form.Select>
                            </>
                            : <>
                                <Form.Label htmlFor="settings-strings-type" className="mt-2">{getLoc("load_section_type")}</Form.Label>
                                <Form.Select defaultValue="text" id="settings-strings-type">
                                    <option value="text">{getLoc("load_section_type_text")}</option>
                                    <option value="json">{getLoc("load_section_type_json")}</option>
                                </Form.Select>
                            </>}
                    </Form.Group>
                    <Form.Group>
                        <Form.Label htmlFor="settings-loaded-strings" className="form-label mt-2">{getLoc("load_section_load_text")}</Form.Label>
                        <Form.Control as="textarea" aria-label="With textarea" id="settings-loaded-strings" onChange={(e) => {CheckStringsType()}}/>
                        {stringsError && 
                            <div id="stringsError" className="form-text">
                                {stringsError}
                            </div>
                        }
                    </Form.Group>
                    <Button className="mt-2" type="submit" variant="primary" disabled={fetchingStringsLoad} onClick={(e) => TransformStrings(e)}>
                        {fetchingStringsLoad
                            ?  <Spinner animation="border" role="output" size="sm">
                                <span className="visually-hidden">{getLoc("load_section_loading")}</span>
                            </Spinner>
                            :  <span>{getLoc("load_section_transform")}</span>
                        }
                    </Button>

                    </Form>
                    </>
                }
                {section && drawStrings &&
                    <> 
                    <h3 className="mb-3">
                    {getLoc("load_section_final_strings")}
                    </h3>
                    <div id="div-strings-to-load" style={{ height: "80vh", overflowY: "auto" }}>
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
                                setStrings(drawStrings)
                                e.preventDefault();
                            }}>
                                <p className="mb-1 fw-semibold">{str.text}</p>
                                <p className="text-body-secondary mt-0">{str.key && <i> {getLoc("load_section_string_key")}: {str.key}</i>}</p>
                            </Container>
                        )}
                    </div>
                    <Button className="mt-2 me-2" type="submit" variant="primary" disabled={fetchingStringsLoad} onClick={LoadStrings}>
                        {fetchingStringsLoad
                            ?  <Spinner animation="border" role="output" size="sm">
                                <span className="visually-hidden">{getLoc("load_section_loading")}</span>
                            </Spinner>
                            :  <span>{getLoc("load_section_upload")}</span>
                        }
                    </Button>
                    {!fetchingStringsLoad &&
                        <Button className="mt-2" type="submit" variant="secondary" onClick={(e) => {setStrings(null)}}>
                            {getLoc("load_section_cancel")}
                        </Button>
                    }
                    {loadError && 
                        <div id="inviteError" className="form-text">
                            {loadError}
                        </div>
                    }
                    </>
                }
            </Container>
            <Footer />
        </>
    );
}