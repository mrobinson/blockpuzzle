/*
 * Copyright 2015 Martin Robinson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function createUTCDate(year, month, day) {
    return new Date(Date.UTC(year, month, day));
}

var emptyData = {
    tracks: [ ]
};

QUnit.test("convertTextToData values", function(assert) {
    var data = BlockPuzzle.convertTextToData("AVAILABLE_HOURS: 10");
    assert.equal(data.options.AVAILABLE_HOURS, 10);

    data = BlockPuzzle.convertTextToData("AVAILABLE_HOURS: 42");
    assert.equal(data.options.AVAILABLE_HOURS, 42);

    data = BlockPuzzle.convertTextToData("LABEL_FONT_FAMILY: a longer string with spaces");
    assert.equal(data.options.LABEL_FONT_FAMILY, "a longer string with spaces", "Simple example with spaces");

    data = BlockPuzzle.convertTextToData("LABEL_FONT_FAMILY: \twhitespace\tin\tthe\tmiddle\t");
    assert.equal(data.options.LABEL_FONT_FAMILY, "whitespace\tin\tthe\tmiddle", "Whitespace should be trimmed");
});

function convertTextToDataNoOptions(string) {
    var data = BlockPuzzle.convertTextToData(string);
    delete data["options"];
    return data;
}

QUnit.test("convertTextToData tracks", function(assert) {
    var simpleTrack = {
        tracks: [ { name: 'user1', reservations: []} ],
    };

    var data = convertTextToDataNoOptions("AVAILABLE_HOURS: 42\n* user1\n");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter");

    data = convertTextToDataNoOptions("AVAILABLE_HOURS: 42\n*\tuser1\t\n");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter.");

    data = convertTextToDataNoOptions("AVAILABLE_HOURS: 42\n*user1");
    assert.propEqual(data, simpleTrack, "Whitespace shouldn't matter.");

    data = convertTextToDataNoOptions("*user1\nAVAILABLE_HOURS: 42\n");
    assert.propEqual(data, simpleTrack, "Order shouldn't matter.");

    var simpleTrack2 = {
        tracks: [ { name: 'User One', reservations: []} ],
    };

    data = convertTextToDataNoOptions(" * User One ");
    assert.propEqual(data, simpleTrack2, "Track name should support whitespace.");

    var multipleTracks = {
        tracks: [
            { name: 'User One', reservations: []},
            { name: 'User Two', reservations: []},
            { name: 'User Three', reservations: []},
        ],
    };

    data = convertTextToDataNoOptions(" * User One \n * User Two\t\n* User Three\t");
    assert.propEqual(data, multipleTracks, "Multiple tracks.");

    data = convertTextToDataNoOptions(" * \t\t");
    assert.propEqual(data, emptyData, "Don't add track with empty track name.");
});

QUnit.test("convertTextToData reservations", function(assert) {
    var simpleReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',  
                              confirmed: true,
                              hours: null,
                              start: createUTCDate(2001, 0, 1),
                              end: createUTCDate(2001, 2, 31) } ],
        } ],
    };

    var data = convertTextToDataNoOptions("* User One\n - Reservation One: Q1/2001");
    assert.propEqual(data, simpleReservation, "Simple reservation");

    var rangeReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One', 
                              confirmed: true,
                              hours: null,
                              start: createUTCDate(2009, 0, 21),
                              end: createUTCDate(2009, 1, 23) } ],
        } ],
    };

    data = convertTextToDataNoOptions("* User One\n - Reservation One: 1/21/2009-2/23/2009");
    assert.propEqual(data, rangeReservation, "Reservation with more complex range");

    rangeReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',
                              confirmed: true,
                              hours: 30,
                              start: createUTCDate(2009, 5, 1),
                              end: createUTCDate(2009, 11, 31) } ],
        } ],
    };

    data = convertTextToDataNoOptions("* User One\n - Reservation One: Q3/2009-Q4/2009, 30hrs");
    assert.propEqual(data, rangeReservation, "Reservation with more complex range");
    data = convertTextToDataNoOptions(" - Reservation One: Q3/2009-Q4/2009, 30");
    assert.propEqual(data, emptyData, "Don't add data when there is no current track.");
    data = convertTextToDataNoOptions("\t\n - \tReservation One: Q3/2009-Q4/2009, 30 hrs");
    assert.propEqual(data, emptyData, "Don't add data when there is no current track.");

    var emptyTrack = {
        tracks: [ {
            name: 'User One',
            reservations: [ ],
        } ],
    };

    data = convertTextToDataNoOptions("* User One\n - \t: Q3-Q4");
    assert.propEqual(data, emptyTrack, "Don't add reservation when the name is empty.");

    unconfirmedRangeReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',
                              confirmed: false,
                              hours: 30,
                              start: createUTCDate(2009, 5, 1),
                              end: createUTCDate(2009, 11, 31) } ],
        } ],
    };

    data = convertTextToDataNoOptions("* User One\n + Reservation One: Q3/2009-Q4/2009, 30hrs");
    assert.propEqual(data, unconfirmedRangeReservation,
                     "Unconfirmed Reservation with more complex range");
});

QUnit.test("Week Numbers", function(assert) {
    var week = BlockPuzzle.dateStringToDate("W1/2019");
    assert.equal(week[0].getTime(), (createUTCDate(2018, 11, 31).getTime()), "Simple week number");
    assert.equal(week[1].getTime(), (createUTCDate(2019, 0, 6).getTime()), "Simple week number");

    // This week should start on the second, because the first of January
    // is a Sunday.
    week = BlockPuzzle.dateStringToDate("W1/2017");
    assert.equal(week[0].getTime(), (createUTCDate(2017, 0, 2)).getTime(),
                 "Week number for week starting on the 2nd");
    assert.equal(week[1].getTime(), (createUTCDate(2017, 0, 8)).getTime(),
                 "Week number for week starting on the 2nd");

    // This last week of the previous year should end on January 1st.
    week = BlockPuzzle.dateStringToDate("W52/2016");
    assert.equal(week[0].getTime(), (createUTCDate(2016, 11, 26)).getTime(),
                 "Week number for year before week 1 starting on the 2nd");
    assert.equal(week[1].getTime(), (createUTCDate(2017, 0, 1)).getTime(),
                 "Week number for year before week 1 starting on the 2nd");

    week = BlockPuzzle.dateStringToDate("W11/2019");
    assert.equal(week[0].getTime(), (createUTCDate(2019, 2, 11)).getTime(),
                 "Week number in the middle of the year");
    assert.equal(week[1].getTime(), (createUTCDate(2019, 2, 17)).getTime(),
                 "Week number in the middle of the year");
});

QUnit.test("dateStringToDate", function(assert) {
    assert.equal(BlockPuzzle.dateStringToDate("01/01/2001")[0].getTime(),
                 (createUTCDate(2001, 0, 1)).getTime(),
                 "Simple date.");
    assert.equal(BlockPuzzle.dateStringToDate("01/01/01"), null,
                 "Two digit years not supported.");
    assert.equal(BlockPuzzle.dateStringToDate("Q1/2012")[0].getTime(),
                 (createUTCDate(2012, 0, 1)).getTime(),
                 "Simple quarter.");
    assert.equal(BlockPuzzle.dateStringToDate("12/2012")[0].getTime(),
                 (createUTCDate(2012, 11, 1)).getTime(),
                 "Simple month date.");
    assert.equal(BlockPuzzle.dateStringToDate("alkja;ds lajsd;f alsf"),
                 null, "Random text should not return a date");
});

QUnit.test("dateRangeToDates", function(assert) {
    function assertValidDateRange(datePair, start, end, message) {
        assert.notEqual(datePair[0], null, message + " (first not null)");
        assert.notEqual(datePair[1], null, message + " (second not null)");
        assert.equal(datePair.length, 2, message + " (length 2)");
        assert.ok(datePair[0] <= datePair[1], message + " (earliest first)");
        assert.deepEqual(datePair[0], start, message + " (first equal)");
        assert.deepEqual(datePair[1], end, message + " (second equal)");
    }

    assertValidDateRange(BlockPuzzle.dateRangeToDates("01/01/2001-02/03/2012"),
                         createUTCDate(2001, 0, 1),
                         createUTCDate(2012, 2, 2),
                         "Simple date range.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("02/03/2012-01/01/2001"),
                         createUTCDate(2001, 0, 1),
                         createUTCDate(2012, 2, 2),
                         "Proper ordering when range goes backward in time.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("01/01/2017 - 08/01/2017"),
                         createUTCDate(2017, 0, 1),
                         createUTCDate(2017, 0, 8),
                         "Date range with spaces.");


    assertValidDateRange(BlockPuzzle.dateRangeToDates("Q1/2001"),
                         createUTCDate(2001, 0, 1),
                         createUTCDate(2001, 2, 31),
                         "Simple quarter.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("Q1/2001-Q1/2001"),
                         createUTCDate(2001, 0, 1),
                         createUTCDate(2001, 2, 31),
                         "Quarter range.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("02/2001-05/2001"),
                         createUTCDate(2001, 1, 1),
                         createUTCDate(2001, 4, 31),
                         "Month range.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("1/2017 - 3/2017"),
                         createUTCDate(2017, 0, 1),
                         createUTCDate(2017, 3, 0),
                         "Month range with spaces.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("02/2001-05/05/2001"),
                         createUTCDate(2001, 1, 1),
                         createUTCDate(2001, 4, 5),
                         "Month range with date on one end.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("H1/2001"),
                         createUTCDate(2001, 0, 1),
                         createUTCDate(2001, 5, 30),
                         "Simple half.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("H1/2001-H1/2002"),
                         createUTCDate(2001, 0, 1),
                         createUTCDate(2002, 5, 30),
                         "Half range.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("2001"),
                         createUTCDate(2001, 0, 1),
                         createUTCDate(2001, 11, 31),
                         "Year range.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("2019"),
                         createUTCDate(2019, 0, 1),
                         createUTCDate(2019, 11, 31),
                         "Year range.");

    assertValidDateRange(BlockPuzzle.dateRangeToDates("0001"),
                         createUTCDate(1, 0, 1),
                         createUTCDate(1, 11, 31),
                         "Odd range.");

    assert.strictEqual(BlockPuzzle.dateRangeToDates("Q1"), null, "Invalid quarter string");
});

QUnit.test("Canvas.hoursStringtoHours", function(assert) {
    let options = new BlockPuzzle.Options();
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24", options), 24,
                       "Simple integer hours");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24.", options), 24,
                       "Simple integer hours with decimal point");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24.456", options), 24.456,
                       "Simple decimal hours");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24.456 hrs", options), 24.456,
                       "Simple decimal hours with 'hrs'");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("24.456hrs", options), 24.456,
                       "Simple decimal hours with 'hrs' attached");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("1fte", options), 40,
                       "Simple integer hours with 'fte' attached");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("1fte", options), 40,
                       "Simple integer hours with ' fte' attached");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("2fte", options), 80,
                       "Another integer hours with 'fte' attached");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("0.5fte", options), 20,
                       "Simple decimal hours with 'fte, options' attached");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("0.1fte", options), 4,
                       "Another decimal hours with 'fte' attached");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("0.1FTE", options), 4,
                       "Simple decimal hours with 'FTE' attached");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("0.1 FTE", options), 4,
                       "Simple decimal hours with ' FTE' attached");
    assert.strictEqual(BlockPuzzle.hoursStringToHours("0.1\tFTE", options), 4,
                       "Simple decimal hours with '\\tFTE' attached");
});

QUnit.test("Canvas.addData", function(assert) {
    var simpleReservation = {
        tracks: [ {
            name: 'User One',
            reservations: [ { name: 'Reservation One',
                              hours: null,
                              start: createUTCDate(2001, 0, 1),
                              end: createUTCDate(2001, 2, 31) } ],
        } ],
    };
    var canvas = new BlockPuzzle.Canvas(null);
    canvas.setData(simpleReservation);
    canvas.setData(simpleReservation);

    assert.equal(canvas.tracks.length, 1, "setData clears old data");
});

QUnit.test("Slice.calculateHoursForReservations", function(assert) {
    var start = new Date();
    var end = new Date();
    end.setDate(end.getDate() + 30);

    var slice = new BlockPuzzle.Slice(start, end);

    var reservation1 = new BlockPuzzle.Reservation("Project1", start, end, null);
    var reservation2 = new BlockPuzzle.Reservation("Project2", start, end, null);
    slice.reservations = [ reservation1, reservation2 ];
    slice.calculateHoursForReservations();
    assert.equal(slice.getHoursAllocatedForReservation(reservation1),
                 17.5, "Two reservations with undefined hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation2),
                 17.5, "Two reservations with undefined hours");
    assert.equal(slice.unusedHours, 5, "Two reservations with undefined hours");
    assert.equal(slice.totalHoursReserved(), 40, "Two reservations with undefined hours");

    var reservation3 = new BlockPuzzle.Reservation("Project1", start, end, 10);
    slice.reservations = [ reservation1, reservation2, reservation3 ];
    slice.calculateHoursForReservations();
    assert.equal(slice.getHoursAllocatedForReservation(reservation1),
                 12.5, "One reservation with defined hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation2),
                 12.5, "One reservation with defined hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation3),
                 10, "One reservation with defined hours");
    assert.equal(slice.unusedHours, 5, "One reservation with defined hours");
    assert.equal(slice.totalHoursReserved(), 40, "One reservation with defined hours");

    var reservation4 = new BlockPuzzle.Reservation("Project1", start, end, 55);
    slice.reservations = [ reservation1, reservation4 ];
    slice.calculateHoursForReservations();
    assert.equal(slice.getHoursAllocatedForReservation(reservation1),
                 0, "A reservation that takes all available hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation4),
                 55, "A reservation that takes all available hours");
    assert.equal(slice.unusedHours, 0, "A reservation that takes all available hours");
    assert.equal(slice.totalHoursReserved(), 55, "A reservation that takes all available hours");

    var reservation5 = new BlockPuzzle.Reservation("Project1", start, end, 55);
    slice.reservations = [ reservation4, reservation5 ];
    slice.calculateHoursForReservations();
    assert.equal(slice.getHoursAllocatedForReservation(reservation1),
                 0, "Two reservations that exceed the total hours");
    assert.equal(slice.getHoursAllocatedForReservation(reservation4),
                 55, "Two reservations that exceed the total hours");
    assert.equal(slice.unusedHours, 0, "Two reservations that exceed the total hours");
    assert.equal(slice.totalHoursReserved(), 110, "Two reservations that exceed the total hours");
});

QUnit.test("Track.buildSlices", function(assert) {
    var track = new BlockPuzzle.Track("Test", createUTCDate(2014, 0, 1), createUTCDate(2014, 11, 31));
    track.setReservations([
        new BlockPuzzle.Reservation("A", createUTCDate(2014, 0, 20), createUTCDate(2014, 0, 31)),
        new BlockPuzzle.Reservation("B", createUTCDate(2014, 5, 10), createUTCDate(2014, 6, 20))]);

    function assertSliceStartAndEnd(slice, start, end, message) {
        assert.deepEqual(slice.start, start, message + " - start correct");
        assert.deepEqual(slice.end, end, message + " - end correct");
    }

    var message = "Slices for non-overlapping reservations";
    assert.equal(track.slices.length, 5, message);
    assertSliceStartAndEnd(track.slices[0], createUTCDate(2014, 0, 1), createUTCDate(2014, 0, 19), message);
    assertSliceStartAndEnd(track.slices[1], createUTCDate(2014, 0, 20), createUTCDate(2014, 0, 31), message);
    assertSliceStartAndEnd(track.slices[2], createUTCDate(2014, 1, 1), createUTCDate(2014, 5, 9), message);
    assertSliceStartAndEnd(track.slices[3], createUTCDate(2014, 5, 10), createUTCDate(2014, 6, 20), message);
    assertSliceStartAndEnd(track.slices[4], createUTCDate(2014, 6, 21), createUTCDate(2014, 11, 31), message);

    track = new BlockPuzzle.Track("Test2", createUTCDate(2014, 0, 1), createUTCDate(2014, 11, 31));
    track.setReservations([
        new BlockPuzzle.Reservation("A", createUTCDate(2014, 0, 20), createUTCDate(2014, 3, 30)),
        new BlockPuzzle.Reservation("B", createUTCDate(2014, 1, 15), createUTCDate(2014, 4, 10))]);
    message = "Slices for overlapping reservations";
    assert.equal(track.slices.length, 5, message);
    assertSliceStartAndEnd(track.slices[0], createUTCDate(2014, 0, 1), createUTCDate(2014, 0, 19), message);
    assertSliceStartAndEnd(track.slices[1], createUTCDate(2014, 0, 20), createUTCDate(2014, 1, 14), message);
    assertSliceStartAndEnd(track.slices[2], createUTCDate(2014, 1, 15), createUTCDate(2014, 3, 30), message);
    assertSliceStartAndEnd(track.slices[3], createUTCDate(2014, 4, 1), createUTCDate(2014, 4, 10), message);
    assertSliceStartAndEnd(track.slices[4], createUTCDate(2014, 4, 11), createUTCDate(2014, 11, 31), message);

    track = new BlockPuzzle.Track("Test3", createUTCDate(2014, 0, 1), createUTCDate(2014, 11, 31));
    track.setReservations([
        new BlockPuzzle.Reservation("A", createUTCDate(2014, 0, 1), createUTCDate(2014, 0, 20)),
        new BlockPuzzle.Reservation("B", createUTCDate(2014, 4, 1), createUTCDate(2014, 5, 30)),
        new BlockPuzzle.Reservation("C", createUTCDate(2014, 2, 1), createUTCDate(2014, 9, 31)),
        new BlockPuzzle.Reservation("D", createUTCDate(2014, 7, 1), createUTCDate(2014, 8, 30)),
        new BlockPuzzle.Reservation("E", createUTCDate(2014, 4, 1), createUTCDate(2014, 5, 30))]);

    message = "Complex slices";
    assert.equal(track.slices.length, 8, message);
    assertSliceStartAndEnd(track.slices[0], createUTCDate(2014, 0, 1), createUTCDate(2014, 0, 20), message);
    assertSliceStartAndEnd(track.slices[1], createUTCDate(2014, 0, 21), createUTCDate(2014, 1, 28), message);
    assertSliceStartAndEnd(track.slices[2], createUTCDate(2014, 2, 1), createUTCDate(2014, 3, 30), message);
    assertSliceStartAndEnd(track.slices[3], createUTCDate(2014, 4, 1), createUTCDate(2014, 5, 30), message);
    assertSliceStartAndEnd(track.slices[4], createUTCDate(2014, 6, 1), createUTCDate(2014, 6, 31), message);
    assertSliceStartAndEnd(track.slices[5], createUTCDate(2014, 7, 1), createUTCDate(2014, 8, 30), message);
    assertSliceStartAndEnd(track.slices[6], createUTCDate(2014, 9, 1), createUTCDate(2014, 9, 31), message);
    assertSliceStartAndEnd(track.slices[7], createUTCDate(2014, 10, 1), createUTCDate(2014, 11, 31), message);
});
