(function() {
  const collapsed = document.getElementsByClassName('collapsed')
  const expanded = document.getElementsByClassName('expanded')

  const allElements: Element[] = Array.from(collapsed).concat(Array.from(expanded))

  const fieldsetsWithLegend = allElements.filter(element => (
    element.tagName === 'FIELDSET'
    && element.firstElementChild?.tagName === 'LEGEND'
  ))

  fieldsetsWithLegend.forEach(fieldset => {
    fieldset.firstElementChild?.addEventListener('click', handleLegendClick)
  })

  function handleLegendClick(e: Event) {
    const target = e.target as typeof e.target & {
      parentNode: HTMLElement
    }

    const parentElement = target?.parentNode

    if (parentElement.classList.contains('collapsed')) {
      parentElement.classList.remove('collapsed')
      parentElement.classList.add('expanded')
    } else {
      parentElement.classList.remove('expanded')
      parentElement.classList.add('collapsed')
    }
  }
})()