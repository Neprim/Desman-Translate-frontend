import Header from "./Header";
import Footer from "./Footer";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { useEffect, useState, useContext } from "react"
// import { AuthContext } from "../AuthContext";
import { fetchSection, fetchSomeAPI } from "../APIController";
import { Link, useParams } from "react-router-dom";

export default function LoadSection() {

    // const { user } = useContext(AuthContext);

    const [section, setSection] = useState(null)
    const [stringsError, setStringsError] = useState(null)
    const [strings, setStrings] = useState(null)

    const link = useParams()

    async function GetSection() {
        try {
            const sec = await fetchSection(link['project_id'], link['section_id'])
            setSection(sec)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        GetSection()
    }, [])

    async function TransformStrings() {
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

            setStrings(strings)
        } catch (err) {
            console.log(err)
            setStringsError(err.errors[0])
        }
    }

    async function LoadStrings() {
        try {
            await fetchSomeAPI(`/api/projects/${link['project_id']}/sections/${link['section_id']}/strings`, "POST", strings)
            window.location.href = `/projects/${link['project_id']}/sections/${link['section_id']}/editor`
        } catch (err) {
            console.log(err)
        }
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
                    <Button className="mt-2" type="submit" variant="primary" onClick={TransformStrings}>
                        Преобразовать
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
                            <Container className="text-left border rounded my-2 pt-3" key={i}>
                            <p className="mb-1 fw-semibold">{str.text}</p>
                            <p className="text-body-secondary mt-0">{str.key && <i> key: {str.key}</i>}</p>
                            </Container>
                        )}
                    </div>
                    <Button className="mt-2 me-2" type="submit" variant="primary" onClick={LoadStrings}>
                        Загрузить
                    </Button>
                    <Button className="mt-2" type="submit" variant="secondary" onClick={(e) => {setStrings(null)}}>
                        Отмена
                    </Button>
                    </>
                }
            </Container>
            <Footer />
        </>
    );
}