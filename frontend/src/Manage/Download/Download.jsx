import { useState, useContext } from "react";
import { Form, Button } from "react-bootstrap"
import { manageContext } from "../Manage"
import { searchWhere, searchCategory } from "../constant"
import "./Download.css";


export const Download = () => {

  const [pattern, setPattern] = useState("")
  const [selectedSearchType, setSelectedSearchType] = useState(searchCategory[0])
  const [selectedSearchWhere, setSelectedSearchWhere] = useState(searchWhere[0])
  const [searchResults, setSearchResults] = useState([])
  const { setToastData } = useContext(manageContext)

  const search = async () => {
    try {
      const resp = await fetch(
        `/api/download/search/?pattern=${pattern}&where=${selectedSearchWhere}&category=${selectedSearchType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      if (resp.status === 200) {
        const data = await resp.json()
        setSearchResults(data.data.torrents)
        console.log(data)
      }
      else {
        setToastData({message: "Failed to perform search", type: "danger"})
      }
    } catch (error) {
      setToastData({message: "Unexpected error occurred", type: "danger"})
      console.log(error)
    }
  }

  return (
    <>
      <div className="shadow p-4 bg-white rounded search">
      <div className="form-row mb-2">
        <Form.Control
          type="text"
          value={pattern}
          placeholder="Search pattern"
          onChange={(e) => setPattern(e.target.value)}
          required
          className="w-75"
        />
        <Form.Select onChange={(e) => setSelectedSearchType(e.target.value)} className="w-25">
          {searchCategory.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </Form.Select>
        <Form.Select onChange={(e) => setSelectedSearchWhere(e.target.value)} className="w-25">
          {searchWhere.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </Form.Select>
        <Button variant="info" onClick={() => search()} className="w-25">
          Search
        </Button>
      </div>
    </div>
    {searchResults.length > 0 && <div className="shadow p-4 bg-white rounded results">
      {searchResults.map((result) => (
        <div key={result.id} className="result">
          <div className="result-title">{result.title}</div>
          <div className="result-category">{result.category}</div>
          <div className="result-size">{result.size}</div>
          <div className="result-seeders">{result.seeders}</div>
          <div className="result-leechers">{result.leechers}</div>
        </div>
      ))}
    </div>}
  </>
  )
}