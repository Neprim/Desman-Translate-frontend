import Header from "./Header";
import Footer from "./Footer";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { useEffect, useState, useContext } from "react"
// import { AuthContext } from "../AuthContext";
import { fetchSection, fetchSomeAPI } from "../APIController";
import { Link, useParams } from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';

export default function LoadSection() {

    // const { user } = useContext(AuthContext);

    const [section, setSection] = useState(null)
    const [sectionType, setSectionType] = useState('text')
    const [stringsError, setStringsError] = useState(null)
    const [strings, setStrings] = useState(null)

    const [loadError, setLoadError] = useState(null)

    const [fetchingStringsLoad, setFetchingStringsLoad] = useState(false)

    const link = useParams()

    async function GetSection() {
        try {
            const sec = await fetchSection(link['project_id'], link['section_id'])
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
                    throw {errors: ["Битый JSON"]}
                }
                
                for (const key in json) {
                    if (typeof(json[key]) != 'string') {
                        throw {errors: ["Вложенные JSONы пока не сделал"]}
                    }

                    strings.push({ text: json[key], key: key })
                }
            }
            if (!strings.length)
                throw {errors: ["А строки то где?"]}

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
            await fetchSomeAPI(`/api/projects/${link['project_id']}/sections/${link['section_id']}/strings`, "POST", strings)
            await fetchSomeAPI(`/api/projects/${link['project_id']}/sections/${link['section_id']}`, "PATCH", {type: sectionType})
            window.location.href = `/projects/${link['project_id']}/sections/${link['section_id']}/editor`
        } catch (err) {
            if (err.status == 413) {
                setLoadError("Слишком большой объём строк, в одной главе может быть не больше 10000 строк.")
            }
            console.log(err)
        }
        setFetchingStringsLoad(false)
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
                {section && !strings &&
                    <>
                    <h1 style={{ marginBottom: 20 }}>Загрузка строк для раздела "{section.name}"</h1>
                    <Form>
                        <Form.Group>
                            <Form.Label htmlFor="settings-strings-type" className="mt-2">Тип строк</Form.Label>
                            <Form.Select defaultValue="text" id="settings-strings-type">
                                <option value="text">Текст</option>
                                <option value="json">JSON</option>
                            </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label htmlFor="settings-loaded-strings" className="form-label mt-2">Текст для загрузки</Form.Label>
                        <Form.Control as="textarea" aria-label="With textarea" id="settings-loaded-strings"/>
                        {stringsError && 
                            <div id="stringsError" className="form-text">
                                {stringsError}
                            </div>
                        }
                    </Form.Group>
                    <Button className="mt-2" type="submit" variant="primary" disabled={fetchingStringsLoad} onClick={(e) => TransformStrings(e)}>
                        {fetchingStringsLoad
                            ?  <Spinner animation="border" role="output" size="sm">
                                <span className="visually-hidden">Загрузка...</span>
                            </Spinner>
                            :  <span>Преобразовать</span>
                        }
                    </Button>

                    </Form>
                    </>
                }
                {section && strings &&
                    <> 
                    <h3 className="mb-3">
                        Итоговое разбиение на строки
                    </h3>
                    <div id="div-strings-to-load">
                        {strings.map((str, i) => 
                            <Container className="text-left text-break border rounded my-2 pt-3" key={i}>
                            <p className="mb-1 fw-semibold">{str.text}</p>
                            <p className="text-body-secondary mt-0">{str.key && <i> ключ: {str.key}</i>}</p>
                            </Container>
                        )}
                    </div>
                    <Button className="mt-2 me-2" type="submit" variant="primary" disabled={fetchingStringsLoad} onClick={LoadStrings}>
                        {fetchingStringsLoad
                            ?  <Spinner animation="border" role="output" size="sm">
                                <span className="visually-hidden">Загрузка...</span>
                            </Spinner>
                            :  <span>Загрузить</span>
                        }
                    </Button>
                    {!fetchingStringsLoad &&
                        <Button className="mt-2" type="submit" variant="secondary" onClick={(e) => {setStrings(null)}}>
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