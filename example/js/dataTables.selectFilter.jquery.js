/** using on dataTable 
 *  "initComplete": function(){
 *      new SelectFilter().init(this, ['I_EMP', 1, 2, 3, 4, 'N_EMP_NAME']);
 *  }
 */
class SelectFilter {
    constructor() {
        this.tableName = '';
        this.modalFilterArray = {};
        this.dataTableSelectFilterObjectArray = [];
    }
    // 初始化
    init($this, colArray) {
        let that = this;
        let columns = $this.api().settings().init().columns ?? $this.api().settings().init().aoColumns;
		console.log(columns)
        that.tableName = $this[0].id;
        // 處理進來的col設定
        if (typeof colArray != 'object' || colArray == null) {
            colArray = Array.from(Array($this.api().columns().header().length).keys())
        }
        for (let i = 0; i < colArray.length; i++) {
            if (typeof colArray[i] == 'string') {
                colArray[i] = columns.findIndex(function (value, index) {
                    return value.data == colArray[i];
                });
            }
        }
        colArray = [...new Set(colArray)];
        colArray.forEach(item => {
            let tempActive = '';
            let api = $this.api();
            $(`#${that.tableName} th:eq(${item})`).find('.filterIcon, .modalFilter').remove();
            if (api.state() != null && api.state().columns[item].search.search !== '') {
                tempActive = 'active';
            }
            // filter 點擊事件
            let filter = $(`<span class="filterIcon ${tempActive}" data-index="${item}"><i class="fas fa-filter"></i></span>`)
                .on('click', function (e) {
                    e.stopPropagation();
                    let index = $(this).data('index');
                    let th = $(e.target).parents('th');
                    $('.modalFilter').hide();
                    $(that.modalFilterArray[`${that.tableName}_${index}`]).css({ left: 0, top: 0 });
                    $(that.modalFilterArray[`${that.tableName}_${index}`]).css({ 'top': th.outerHeight(), 'min-width': '130px' });
                    $(that.modalFilterArray[`${that.tableName}_${index}`]).show();
                });
            $(`#${that.tableName} th:eq(${item})`)
                .append(filter);
        });
        // build下拉清單
        that.templateFilter($this, colArray);
        // sort事件重加
        $.each($($this).find('th'), function (index, element) {
            if ($._data(element, 'events') == null || $._data(element, 'events').blur != null) {
                return;
            }
            let th = this;
            $(th).append('<span class="my-sort"></span>');
            $.each($._data(element, 'events'), function (type, list) {
                $.each(list, function (j, event) {
                    $(th).find('.my-sort').on(event.type, event.handler);
                });
                $(th).off(type);
            });
        });
        // When dataTable draw
        if ($this.api().init().bServerSide) {
            $($this[0]).on('draw.dt', function (e) {
                // build下拉清單
                that.templateFilter($this, colArray);
            });
        } else {
            $($this[0]).on('search.dt', function (e) {
                // build下拉清單
                that.templateFilter($this, colArray);
            });
        }
        // When click modalFilter outside than close modalFilter
        $(document).on("click", function (e) {
            if (!$(e.target).parents().is('.modalFilter')) {
                $('.modalFilter').hide();
            }
        });
    }
    // build下拉清單
    templateFilter($this, colArray) {
        let that = this;
        setTimeout(function () {
            $(`#${that.tableName}`).find('.modalFilter').remove();
            let columns = $this.api().columns({ search: 'applied' });
            let template = `<div class="modalFilter">
                        <div class="searchbox">
                            <input type="search" class="form-control" autocomplete="off" />
                        </div>
                        <div class="filter-body pt-1 pb-0">{0}</div>
                        <div class="filter-footer text-right pr-0">
                            <button type="button" class="btn btn-light Clear">Clear</button>
                            <button type="button" class="btn btn-primary Ok">Ok</button>
                        </div>
                    </div>`;
            colArray.forEach(item => {
                columns.every(function (i) {
                    if (item === i) {
                        let column = this;
                        let content = '';
                        let empty = '';
                        //let columnName = $(this.header()).text().replace(/\s+/g, "_");
                        let distinctArray = [];
                        //let allcheck = `${columnName}_allCheck`;
                        let allcheck = `${item}_allCheck`;
                        // 全選放在第一個
                        content = `<div><input type="checkbox" class="allCheck" id="${allcheck}" checked /><label for="${allcheck}">全選</label></div>`;
                        // 組合元素
                        column.data().each(function (d, j) {
                            if (distinctArray.indexOf(d) == -1) {
                                //let id = `${that.tableName}_${columnName}_${j}`;
                                let id = `${that.tableName}_${item}_${j}`;
                                if (d == null || d == "") {
                                    empty = `<div><input type="checkbox" value="^$"  id="${id}" checked /><label for="${id}">(空格)</label></div>`;
                                } else {
                                    content += `<div><input type="checkbox" value="${d}"  id="${id}" checked /><label for="${id}">${d}</label></div>`;
                                }
                                distinctArray.push(d);
                            }
                        });
                        // 如有空格將空格放在最後
                        content += empty;
                        let newTemplate = $(template.replace('{0}', content).replace('{1}', item).replace('{1}', item).replace('{2}', that.tableName).replace('{2}', that.tableName));
                        $(newTemplate).on('click', function (e) {
                            e.stopPropagation();
                        });
                        // 全選事件
                        $(newTemplate).on('change', '.allCheck', function (e) {
                            let node = this;
                            let rootNode = $(node).parent().parent();
                            rootNode.find('input:checkbox').each(function (index, checkbox) {
                                if (node.checked) {
                                    checkbox.checked = true;
                                } else {
                                    checkbox.checked = false;
                                }
                            });
                        });
                        // live search
                        $(newTemplate).on('keyup', 'input[type="search"]', function (e) {
                            let searchString = $(this).val().toUpperCase().trim();
                            let rootNode = $(this).parent().parent().children(".filter-body");
                            if (searchString == '') {
                                rootNode.find('div').show();
                                if (that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`] == null
                                    || that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`].length == 0) {
                                    rootNode.find('div input').prop("checked", true);
                                }
                            } else {
                                rootNode.find("div").hide();
                                rootNode.find('div input').prop("checked", false);
                                $.each(that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`], function (index, value) {
                                    rootNode.find(`div input[value="${value}"]`).prop("checked", true);
                                });
                                $.each(searchString.split(' '), function (index, value) {
                                    rootNode.find(`div:contains('${value}')`).show();
                                });
                            }
                        });
                        // 取消全選
                        $(newTemplate).on('change', 'input[type="checkbox"]', function (e) {
                            let node = this;
                            if (that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`] == null) {
                                // 初始陣列
                                that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`] = [];
                            }

                            if ($(node).is(':checked')) {
                                // 勾選時加入暫存陣列
                                that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`].push($(node).val());
                            }

                            if (!$(node).is(':checked')) {
                                var index = that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`].indexOf($(node).val());

                                if (index != -1) {
                                    // 取消勾選時清除
                                    that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`].splice(index, 1);
                                }
                                $(node).parent().parent().find('.allCheck').prop('checked', false);
                            }
                        });
                        // 清除按鈕
                        $(newTemplate).on('click', '.Clear', function () {
                            // 清除暫存陣列
                            that.dataTableSelectFilterObjectArray[`${that.tableName}_${item}`] = [];
                            let rootNode = $(this).parent().parent();
                            rootNode.find(".filterSearchText").val('');
                            rootNode.find('input:checkbox').each(function (index, checkbox) {
                                checkbox.checked = false;
                                $(checkbox).parent().show();
                            });
                            $(`#${that.tableName}`).DataTable().column(item).search(
                                '',
                                true, false
                            ).draw();
                            rootNode.hide();
                            $.each(colArray, function (index, value) {
                                $(that.modalFilterArray[`${that.tableName}_${item}`]).remove();
                            });
                            $(`#${that.tableName} th:eq(${item}) .filterIcon`).removeClass('active');
                        });
                        // 確定按鈕
                        $(newTemplate).on('click', '.Ok', function () {
                            let rootNode = $(this).parent().parent();
                            let searchString = '', counter = 0;
                            rootNode.find('input:checkbox').each(function (index, checkbox) {
                                if (checkbox.checked) {
                                    if (!$(`#${that.tableName}`).DataTable().init().bServerSide) {
                                        checkbox.value = checkbox.value.replace(/[\(\)\n]/g, '.');
                                    } else {
                                        console.log(checkbox.value)
                                    }
                                    searchString += (counter == 0) ? checkbox.value : '|' + checkbox.value;
                                    counter++;
                                }
                            });
                            $(`#${that.tableName}`).DataTable().column(item).search(
                                searchString,
                                true, false, true
                            ).draw();
                            rootNode.hide();
                            $.each(colArray, function (index, value) {
                                $(that.modalFilterArray[`${that.tableName}_${value}`]).remove();
                            });
                            $(`#${that.tableName} th:eq(${item}) .filterIcon`).addClass('active');
                        });
                        that.modalFilterArray[`${that.tableName}_${item}`] = newTemplate;
                        $(`#${that.tableName}`).find(`th:eq(${i})`).append(newTemplate);
                        content = '';
                    }
                });
            });
        }, 500);
    }
}
