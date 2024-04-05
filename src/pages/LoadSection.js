import Navbar from "./Navbar";
import Footer from "./Footer";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
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
            <Navbar />
            <div
                className="container text-left"
                style={{
                    marginTop: 50,
                    marginLeft: "auto",
                    marginRight: "auto",
                    width: "20%",
                    minWidth: 300
                }}
            >
                {section && !strings &&
                    <>
                    <h1 style={{ marginBottom: 20 }}>Загрузка строк для раздела {section.name}</h1>
                    <label htmlFor="settings-strings-type" className="form-label" style={{ marginTop: '10px' }}>Тип строк</label>
                    <select className="form-select" defaultValue="text" id="settings-strings-type">
                        <option value="text">Текст</option>
                        <option value="json">JSON</option>
                    </select>
                    <label htmlFor="settings-loaded-strings" className="form-label" style={{ marginTop: '10px' }}>Текст для загрузки</label>
                    <textarea className="form-control" aria-label="With textarea" id="settings-loaded-strings"/>
                    {stringsError && 
                        <div id="stringsError" className="form-text">
                            {stringsError}
                        </div>
                    }
                    <Button style={{ marginTop: '10px' }} type="submit" variant="primary" onClick={TransformStrings}>
                        Преобразовать
                    </Button>
                    </>
                }
                {section && strings && // Нужно сделать красиво
                    <> 
                    <div id='div-strings-to-load'>
                        {strings.map((str, i) => 
                            <div key={i}>
                            <strong>{str.text}</strong>
                            {str.key && <i> key: {str.key}</i>}
                            </div>
                        )}
                    </div>
                    <Button style={{ marginTop: '10px', marginRight: '10px' }} type="submit" variant="primary" onClick={LoadStrings}>
                        Загрузить
                    </Button>
                    <Button style={{ marginTop: '10px' }} type="submit" variant="secondary" onClick={(e) => {setStrings(null)}}>
                        Отмена
                    </Button>
                    </>
                }
            </div>
            <Footer />
        </>
    );
}