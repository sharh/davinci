import * as React from 'react'
import * as classnames from 'classnames'
import { iconMapping } from './chartUtil'

const Icon = require('antd/lib/icon')
const Row = require('antd/lib/row')
const Col = require('antd/lib/col')
const Checkbox = require('antd/lib/checkbox')
const Pagination = require('antd/lib/pagination')
const Input = require('antd/lib/input')
const Search = Input.Search
const styles = require('../Widget.less')

interface IWidgetSelectorProps {
  className: any,
  widgets: any[],
  loginUser: { id: number, admin: boolean },
  multiple: boolean,
  onWidgetsSelect: (widgets) => void,
}

interface IWidgetSelectorStates {
  authorizedWidgets: any[],
  screenWidth: number,
  kwWidget: string,
  pageSize: number,
  currentPage: number,
  showSelected: false,
  widgetsSelected: any[]
}

export class WidgetSelector extends React.Component<IWidgetSelectorProps, IWidgetSelectorStates> {
  constructor (props) {
    super(props)
    this.state = {
      authorizedWidgets: [],
      screenWidth: 0,
      kwWidget: '',
      pageSize: 24,
      currentPage: 1,
      showSelected: false,
      widgetsSelected: []
    }
  }

  public componentWillMount () {
    this.getScreenWidth()
  }

  public componentDidMount () {
    const {
      widgets
    } = this.props
    if (widgets.length > 0) {
      this.setAuthorizedWidgets(widgets)
    }
  }

  public componentWillReceiveProps (nextProps) {
    const { widgets, loginUser } = this.props
    if (nextProps.widgets !== widgets) {
      this.setAuthorizedWidgets(nextProps.widgets)
    }
    window.addEventListener('resize', this.getScreenWidth, false)
  }

  public componentWillUnmount () {
    window.removeEventListener('resize', this.getScreenWidth, false)
  }

  private getScreenWidth = () => {
    this.setState({ screenWidth: document.documentElement.clientWidth })
  }

  private setAuthorizedWidgets = (widgets) => {
    const { loginUser } = this.props
    if (loginUser.admin) {
      this.setState({
        authorizedWidgets: widgets.filter((widget) => widget['create_by'] === loginUser.id)
      })
    }
  }

  private onChange = (page) => {
    this.setState({
      currentPage: page
    })
  }

  private onSearchWidgetItem = (value) => {
    this.setState({
      kwWidget: value
    })
  }

  private getWidgets () {
    const {
      widgets,
      loginUser
    } = this.props

    const {
      kwWidget,
      currentPage,
      showSelected,
      widgetsSelected
    } = this.state

    if (!Array.isArray(widgets)) {
      return []
    }

    const reg = new RegExp(kwWidget, 'i')

    const filteredWidgets = widgets.filter((w) => {
      let valid = true
      if (showSelected) {
        valid = valid && widgetsSelected.findIndex((ws) => ws.id === w.id) >= 0
      }
      if (valid && loginUser && loginUser.admin) {
        valid = valid && w['create_by'] === loginUser.id
      }
      if (valid && kwWidget) {
        valid = valid && reg.test(w.name)
      }
      return valid
    })

    return filteredWidgets
  }

  private onShowSizeChange = (current, pageSize) => {
    this.setState({
      currentPage: current,
      pageSize
    })
  }

  private onWidgetSelect = (w) => (e) => {
    const {
      multiple,
      onWidgetsSelect
    } = this.props

    let newWidgetsSelected

    if (!multiple) {
      newWidgetsSelected = [w]
    } else {
      const {
        widgetsSelected
      } = this.state
      const idx = widgetsSelected.findIndex((ws) => ws.id === w.id)
      newWidgetsSelected = [...widgetsSelected]
      idx < 0 ? newWidgetsSelected.push(w) : newWidgetsSelected.splice(idx, 1)
      this.setState({ widgetsSelected: newWidgetsSelected })
      if (widgetsSelected.length <= 0 && this.state.showSelected) {
        this.setState({ showSelected: false })
      }
    }

    this.setState({ widgetsSelected: newWidgetsSelected })
    onWidgetsSelect(newWidgetsSelected)
  }

  private onShowTypeChange = (e) => {
    this.setState({
      showSelected: e.target.checked,
      currentPage: 1
    })
  }

  public render () {
    const {
      className,
      widgets,
      loginUser
    } = this.props

    const {
      screenWidth,
      pageSize,
      currentPage,
      showSelected,
      widgetsSelected
    } = this.state

    const widgetsFiltered = this.getWidgets()

    const startCol = (currentPage - 1) * pageSize
    const endCol = Math.min(currentPage * pageSize, widgetsFiltered.length)
    const widgetsCurrent = widgetsFiltered.slice(startCol, endCol)

    const widgetsList = widgetsCurrent.map((w, idx) => {
      const widgetType = JSON.parse(w.chart_params).widgetType
      const widgetClassName = classnames({
        [styles.widget]: true,
        [styles.selector]: true,
        [styles.selected]: w.id === 1
      })
      const checkmark = widgetsSelected.findIndex((ws) => ws.id === w.id) >= 0
        ? (
          <div className={styles.checkmark}>
            <Icon type="check" />
          </div>
        )
        : ''

      return (
        <Col md={8} sm={12} xs={24} key={w.id} onClick={this.onWidgetSelect(w)}>
          <div className={widgetClassName}>
            <h3 className={styles.title}>{w.name}</h3>
            <p className={styles.content}>{w.desc}</p>
            <i className={`${styles.pic} iconfont ${iconMapping[widgetType]}`} />
            {checkmark}
          </div>
        </Col>
      )
    })

    return (
      <div className={className}>
        <Row gutter={20} className={`${styles.searchRow}`}>
          <Col span={17}>
            <Checkbox checked={showSelected} onChange={this.onShowTypeChange}>已选</Checkbox>
          </Col>
          <Col span={7}>
            <Search
              placeholder="Widget 名称"
              onSearch={this.onSearchWidgetItem}
            />
          </Col>
        </Row>
        <Row gutter={20}>
          {widgetsList}
        </Row>
        <Row>
          <Pagination
            simple={screenWidth < 768 || screenWidth === 768}
            className={styles.paginationPosition}
            showSizeChanger
            onShowSizeChange={this.onShowSizeChange}
            onChange={this.onChange}
            total={widgetsFiltered.length}
            defaultPageSize={24}
            pageSizeOptions={['24', '48', '72', '96']}
            current={currentPage}
          />
        </Row>
      </div>
    )
  }
}

export default WidgetSelector
