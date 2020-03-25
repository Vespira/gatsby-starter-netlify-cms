import React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

const NotFoundPage = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="404: Not Found" />
      <h1>404: Page Not Found</h1>
      <p>You enter into a dead-end route, nothing usually fears you, but something's wrong about this place ... What do you want to do ?</p>
      <div>
        <button >Head back, this place is creepy</button>
        <button >Take me home !</button>
      </div>
    </Layout>
  )
}

export default NotFoundPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
