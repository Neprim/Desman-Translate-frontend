
export async function fetchSomeAPI(link, method = "GET", body = {}) {
    let options = { method: method, }
    if (method == 'POST' || method == 'PATCH') {
        options.body = JSON.stringify(body)
        options.headers = { 'Content-Type': 'application/json; charset=UTF-8', }
    }

    const response = await fetch(link, options)
    if (!response.ok) {
        throw { status: response.status, errors: JSON.parse(await response.text() || "{}")?.errors }
    }
    try {
        let data = await response.json()
        return data
    } catch (err) {

    }
}

export async function fetchProject(project_id, fetch_members = false, fetch_roles = false, generate_statistics = false) {
    let q = `/api/projects/${project_id}?`
    if (fetch_members)
        q += `fetch_members=${fetch_members}&`
    if (fetch_roles)
        q += `fetch_roles=${fetch_roles}&`
    if (generate_statistics)
        q += `generate_statistics=${generate_statistics}`
    return await fetchSomeAPI(q)
}

export async function fetchProjects(options) {
    let str = "/api/projects?"
    for (const key in options) {
        str += `${key}=${options[key]}&`
    }
    let projects = await fetchSomeAPI(str)
    return projects
}

export async function fetchMembers(project_id, fetch_members = true) {
    let q = `/api/projects/${project_id}/members?`
    if (fetch_members)
        q += `fetch_members=${fetch_members}`
    return await fetchSomeAPI(q)
}

export async function fetchSections(project_id, generate_statistics = false) {
    let q = `/api/projects/${project_id}/sections?`
    if (generate_statistics)
        q += `generate_statistics=${generate_statistics}`
    return await fetchSomeAPI(q)
}

export async function fetchSection(project_id, section_id, generate_statistics = false) {
    let q = `/api/projects/${project_id}/sections/${section_id}?`
    if (generate_statistics)
        q += `generate_statistics=${generate_statistics}`
    return await fetchSomeAPI(q)
}

export async function fetchStrings(project_id, section_id, fetch_translations = false, fetch_votes = false) {
    let q = `/api/projects/${project_id}/sections/${section_id}/strings?`
    if (fetch_translations)
        q += `fetch_translations=${fetch_translations}&`
    if (fetch_votes)
        q += `fetch_votes=${fetch_votes}`
    return await fetchSomeAPI(q)
}

export async function fetchString(project_id, section_id, string_id, fetch_translations = false, fetch_votes = false) {
    let q = `/api/projects/${project_id}/sections/${section_id}/strings/${string_id}?`
    if (fetch_translations)
        q += `fetch_translations=${fetch_translations}&`
    if (fetch_votes)
        q += `fetch_votes=${fetch_votes}`
    return await fetchSomeAPI(q)
}

export async function fetchUser(user_id, fetch_projects = false) {
    let q = `/api/users/${user_id}?`
    if (fetch_projects)
        q += `fetch_projects=${fetch_projects}`
    return await fetchSomeAPI(q)
}

export async function fetchUserInvites(fetch_users = true, fetch_projects = true) {
    let q = `/api/invites?`
    if (fetch_users)
        q += `fetch_users=${fetch_users}&`
    if (fetch_projects)
        q += `fetch_projects=${fetch_projects}`
    return await fetchSomeAPI(q)
}

export async function fetchProjectInvites(project_id, fetch_users = true) {
    let q = `/api/projects/${project_id}/invites?`
    if (fetch_users)
        q += `fetch_users=${fetch_users}`
    return await fetchSomeAPI(q)
}
