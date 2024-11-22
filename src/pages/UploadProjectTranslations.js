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
                    throw {errors: ["Битый JSON"]}
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
                throw {errors: ["Отсутствуют строки для загрузки."]}

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
                setLoadError("Нельзя загружать пустые переводы.")
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
            <Container
                className="text-left mt-5 mx-auto"
                style={{
                    width: '40%',
                    minWidth: '300px'
                }}
            >
                {sections && !translations &&
                    <>
                    <p className="text-middle text-break"><i>Утилита полунаколенная, потому может работать не так, если есть пересечения по ключам между разделами. Ну и не будет работать, если разделы не типа JSON.</i></p>
                    <h1 style={{ marginBottom: 20 }} className="text-middle text-break">Загрузка переводов для проекта "{project?.name}"</h1>
                    <Form >
                        <Form.Group>
                            <Form.Label htmlFor="settings-loaded-translations" className="form-label mt-2">Текст для загрузки</Form.Label>
                            <Form.Control as="textarea" aria-label="With textarea" id="settings-loaded-translations"/>
                            {translationsError && 
                                <div id="translationsError" className="form-text">
                                    {translationsError}
                                </div>
                            }
                            <Form.Check
                                type="checkbox"
                                id="checkbox-load-sames"
                                label='Загрузить совпадающие с оригиналом'
                            />
                        </Form.Group>
                        <Button className="mt-2" type="submit" variant="primary" disabled={fetchingTranslationsLoad} onClick={(e) => TransformTranslations(e)}>
                            {fetchingTranslationsLoad
                                ?  <Spinner animation="border" role="output" size="sm">
                                    <span className="visually-hidden">Загрузка...</span>
                                </Spinner>
                                :  <span>Преобразовать</span>
                            }
                        </Button>
                    </Form>
                    </>
                }
                {sections && translations &&
                    <> 
                    <h3 className="mb-3">
                        Итоговые переводы для загрузки
                    </h3>
                    <div id="div-translations-to-load" style={{ height: "80vh", overflowY: "auto" }}>
                        {translations.map((tr, i) => 
                            <Container className="text-left text-break border rounded my-2 pt-3" key={tr.string.id} style={{whiteSpace: "pre-wrap"}}>
                            <p className="mb-1 fw-semibold">Оригинал: {tr.string.text}</p>
                            <p className="mb-1 fw-semibold">Перевод: {tr.text}</p>
                            <p className="text-body-secondary mt-0"><i> Ключ: {tr.string.key}</i></p>
                            <p className="text-body-secondary mt-0"><i> Раздел: {sections.find((sec) => sec.id == tr.string.section_id).name}</i></p>
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
                                <span className="visually-hidden">Загрузка...</span>
                            </Spinner>
                            :  <span>Загрузить</span>
                        }
                    </Button>
                    {!fetchingTranslationsLoad &&
                        <Button className="mt-2" type="submit" variant="secondary" onClick={(e) => {setTranslations(null)}}>
                            Отмена
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