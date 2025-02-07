import Header from "./Header";
import Footer from "./Footer";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { useEffect, useState, useContext } from "react"
import { AuthContext } from "../AuthContext";
import { fetchProject, fetchSections, fetchSomeAPI, fetchStrings } from "../APIController";
import { Link, useParams } from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';
import { ProgressBar } from "react-bootstrap";
import { getLoc } from "../Translation";

let strings = []

export default function UploadProjectTranslations() {

    const { user } = useContext(AuthContext);

    const [project, setProject] = useState(null)
    const [translations, setTranslations] = useState(null)
    const [sections, setSections] = useState([])
    const [translationsError, setTranslationsError] = useState(null)
    const [translationLoadNum, setTranslationLoadNum] = useState(0)

    const [loadError, setLoadError] = useState(null)

    const [fetchingTranslationsLoad, setfetchingTranslationsLoad] = useState(false)

    const link = useParams()

    async function GetSection() {
        try {
            let secs = await fetchSections(link["project_id"])
            setProject(await fetchProject(link["project_id"]))
            setSections(secs)
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

    async function GetStrings() {
		try {
            strings = []
            for (const sec of sections) {
                if (sec.type != "json")
                    continue
			    let strs = await fetchStrings(link["project_id"], sec.id, true, true)
                for (let str of strs) {
                    str.section_id = sec.id
                    strings.push(str)
                }
            }
		} catch (err) {
			console.log(err)
		}
	}

    useEffect(() => {
        GetSection()
    }, [])

    useEffect(() => {
        if (!sections.length)
            return

        GetStrings()
    }, [sections])

    async function TransformTranslations(e) {
        e.preventDefault()
        setfetchingTranslationsLoad(true)
        try {
            setTranslationsError(null)
            const loaded_translations = document.getElementById("settings-loaded-translations").value
            let translations = []

            if (true) {
                let json
                try {
                    json = JSON.parse(loaded_translations)
                } catch (err) {
                    throw {errors: [getLoc("upload_project_translations_error_bad_json")]}
                }

                let load_sames = document.getElementById('checkbox-load-sames').checked
                console.log(json)
                console.log(load_sames)
                
                for (const str of strings) {
                    if (json[str.key] == undefined)
                        continue
                    if (str.translations.find((tr) => tr.text == json[str.key]))
                        continue
                    if (!load_sames && str.text == json[str.key])
                        continue
                    
                    translations.push({string: str, text: json[str.key]})
                }
            }
            if (!translations.length)
                throw {errors: [getLoc("upload_project_translations_error_no_strings")]}

            console.log(translations)
            setTranslations(translations)
        } catch (err) {
            console.log(err)
            setTranslationsError(err.errors[0])
        }
        setfetchingTranslationsLoad(false)
    }

    async function UploadTranslations() {
        setfetchingTranslationsLoad(true)
        try {
            for (let i = 0; i < translations.length; i++) {
                const tr = translations[i]
                await fetchSomeAPI(`/api/projects/${link['project_id']}/sections/${tr.string.section_id}/strings/${tr.string.id}/translations`, "POST", {text: tr.text})
                // await new Promise(resolve => setTimeout(resolve, 1000))
                setTranslationLoadNum(i + 1)
            }
            window.location.href = `/projects/${link['project_id']}`
        } catch (err) {
            if (err.status == 400 && err.errors[0].key == 'text' && err.errors[0].kind == "required") {
                setLoadError(getLoc("upload_project_translations_error_empty_translations"))
            } else {
                setLoadError(JSON.stringify(err))
            }
            console.log(err)
        }
        setfetchingTranslationsLoad(false)
    }


    return (
        <>
            <Header />
            <div style={{margin: "10px", position: "absolute"}}>
                <Button variant="outline-dark" onClick={() => {window.location.href = `/projects/${link["project_id"]}`}}>{getLoc("go_back")}</Button>
            </div>
            <Container
                className="text-left mt-5 mx-auto"
                style={{
                    width: '40%',
                    minWidth: '300px'
                }}
            >
                {sections && !translations &&
                    <>
                    <p className="text-middle text-break"><i>{getLoc("upload_project_translations_attention")}</i></p>
                    <h1 style={{ marginBottom: 20 }} className="text-middle text-break">{getLoc("upload_project_translations_load_strings_sections")} "{project?.name}"</h1>
                    <Form >
                        <Form.Group>
                            <Form.Label htmlFor="settings-loaded-translations" className="form-label mt-2">{getLoc("upload_project_translations_load_text")}</Form.Label>
                            <Form.Control as="textarea" aria-label="With textarea" id="settings-loaded-translations"/>
                            {translationsError && 
                                <div id="translationsError" className="form-text">
                                    {translationsError}
                                </div>
                            }
                            <Form.Check
                                type="checkbox"
                                id="checkbox-load-sames"
                                label={getLoc("upload_project_translations_load_sames")}
                            />
                        </Form.Group>
                        <Button className="mt-2" type="submit" variant="primary" disabled={fetchingTranslationsLoad} onClick={(e) => TransformTranslations(e)}>
                            {fetchingTranslationsLoad
                                ?  <Spinner animation="border" role="output" size="sm">
                                    <span className="visually-hidden">{getLoc("upload_project_translations_loading")}</span>
                                </Spinner>
                                :  <span>{getLoc("upload_project_translations_transform")}</span>
                            }
                        </Button>
                    </Form>
                    </>
                }
                {sections && translations &&
                    <> 
                    <h3 className="mb-3">
                    {getLoc("upload_project_translations_final_strings")}
                    </h3>
                    <div id="div-translations-to-load" style={{ height: "80vh", overflowY: "auto" }}>
                        {translations.map((tr, i) => 
                            <Container className="text-left text-break border rounded my-2 pt-3" key={tr.string.id} style={{whiteSpace: "pre-wrap"}}>
                            <p className="mb-1 fw-semibold">{getLoc("upload_project_translations_original")}: {tr.string.text}</p>
                            <p className="mb-1 fw-semibold">{getLoc("upload_project_translations_translations")}: {tr.text}</p>
                            <p className="text-body-secondary mb-0"><i> {getLoc("upload_project_translations_key")}: {tr.string.key}</i></p>
                            <p className="text-body-secondary mb-0"><i> {getLoc("upload_project_translations_section")}: {sections.find((sec) => sec.id == tr.string.section_id).name}</i></p>
                            </Container>
                        )}
                    </div>
                    {fetchingTranslationsLoad && 
                        <div className="progress-stacked" style={{ margin: '10px 0px 5px 0px' }}>
                            <ProgressBar className="progress" striped animated label={`${translationLoadNum}/${translations.length}`} style={{ width: `${translationLoadNum / translations.length * 100}%` }} aria-valuenow={translationLoadNum} aria-valuemin={0} aria-valuemax={translations.length}/>
                        </div>
                    }
                    <Button className="mt-2 me-2" type="submit" variant="primary" disabled={fetchingTranslationsLoad} onClick={UploadTranslations}>
                        {fetchingTranslationsLoad
                            ?  <Spinner animation="border" role="output" size="sm">
                                <span className="visually-hidden">{getLoc("upload_project_translations_loading")}</span>
                            </Spinner>
                            :  <span>{getLoc("upload_project_translations_upload")}</span>
                        }
                    </Button>
                    {!fetchingTranslationsLoad &&
                        <Button className="mt-2" type="submit" variant="secondary" onClick={(e) => {setTranslations(null)}}>
                            {getLoc("upload_project_translations_cancel")}
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