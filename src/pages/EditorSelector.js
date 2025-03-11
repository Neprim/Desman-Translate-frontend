import Header from "./Header";
import Footer from "./Footer";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import { useEffect, useState, useContext } from "react"
// import { AuthContext } from "../AuthContext";
import { fetchSections, fetchSomeAPI } from "../APIController";
import { Link, useParams } from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';
import { getLoc } from "../Translation";

export default function EditorSelector() {

    const [sections, setSections] = useState([])
    const [sectionsSelected, setSectionsSelected] = useState([])

    const [loadError, setLoadError] = useState(null)

    const link = useParams()

    async function GetSections() {
        try {
            const secs = await fetchSections(link['project_id'])
            setSections(secs)

            let secsel = []
            for (const sec of secs) {
                secsel.push(false)
            } 
            setSectionsSelected(secsel)
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

    function ProceedSelectedSections() {
        if (sectionsSelected.reduce((s, x) => s + x, 0) == sectionsSelected.length) {
            window.location.href = `/projects/${link['project_id']}/editor/all`
            return
        }

        let secs = []
        for (let i = 0; i < sectionsSelected.length; i++) {
            if (sectionsSelected[i]) {
                secs.push(sections[i].id.toString(16))
            }
        }

        window.location.href = `/projects/${link['project_id']}/editor/${secs.join("_")}`
    }

    function SelectSection(e) {
        if (e.target.name == 'all') {
            for (let i = 0; i < sections.length; i++) {
                sectionsSelected[i] = e.target.checked
                document.getElementById(`checkbox-${sections[i].id}`).checked = e.target.checked
            }
            setSectionsSelected(sectionsSelected)
        } else {
            sectionsSelected[e.target.name] = e.target.checked
            document.getElementById(`checkbox-all`).checked = sectionsSelected.reduce((s, x) => s + x, 0) == sectionsSelected.length
            setSectionsSelected(sectionsSelected)
        }
    }

    useEffect(() => {
        GetSections()
    }, [])

    return (
        <>
            <Header />
            <title>{getLoc("editor_selector_title")}</title>
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
                {sections &&
                    <>
                    <h1 style={{ marginBottom: 20 }} className="text-middle text-break">{getLoc("editor_selector_sections_choose")}</h1>
                    <Form>
                    <Form.Check
                        type="checkbox"
                        label={getLoc("editor_selector_choose_all")}
                        name="all"
                        id="checkbox-all"
                        onChange={(e) => {SelectSection(e)}}
                    /><br/>
                    {sections.map((sec, ind) => 
                        <Form.Check
                            type="checkbox"
                            label={sec.name}
                            name={ind}
                            id={"checkbox-" + sec.id}
                            onChange={(e) => {SelectSection(e)}}
                        />
                    )}
                    <Button className="mt-2" variant="primary" onClick={(e) => ProceedSelectedSections(e)}>
                        {getLoc("editor_selector_choose")}
                    </Button>
                    </Form>
                    </>
                }
            </Container>
            <Footer />
        </>
    );
}